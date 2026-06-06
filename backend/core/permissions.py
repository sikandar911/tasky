from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """Allow access only to verified superadmin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'SUPERADMIN'
            and getattr(request.user, 'is_verified', False)
        )


class IsSuperAdminOrAdmin(BasePermission):
    """Allow access to verified SUPERADMIN or ADMIN users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ('SUPERADMIN', 'ADMIN')
            and getattr(request.user, 'is_verified', False)
        )


class IsNotMember(BasePermission):
    """Deny access to MEMBER-role users (allow ADMIN and SUPERADMIN)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) in ('SUPERADMIN', 'ADMIN')
        )


class IsProjectAdmin(BasePermission):
    """Allow access only to the creator (admin) of the project, who is not a MEMBER."""

    def _get_project_from_view(self, request, view):
        """Helper: resolve project from view kwargs."""
        from apps.projects.models import Project
        pk = view.kwargs.get('pk') or view.kwargs.get('project_pk')
        if pk:
            try:
                return Project.objects.get(pk=pk)
            except Project.DoesNotExist:
                return None
        return None

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        # Members can never edit/delete projects
        if getattr(request.user, 'role', None) == 'MEMBER':
            return False
        project = self._get_project_from_view(request, view)
        if project is None:
            # No project context yet — defer to has_object_permission
            return True
        return project.created_by == request.user

    def has_object_permission(self, request, view, obj):
        # Members can never edit/delete projects
        if getattr(request.user, 'role', None) == 'MEMBER':
            return False
        # obj can be a Project or a ProjectMember; resolve to Project
        from apps.projects.models import Project, ProjectMember
        if isinstance(obj, Project):
            project = obj
        elif isinstance(obj, ProjectMember):
            project = obj.project
        else:
            project = obj
        return project.created_by == request.user


class IsProjectMember(BasePermission):
    """Allow access only to members of the project."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        from apps.projects.models import ProjectMember, Project
        
        # In TaskViewSet, 'pk' refers to the Task ID. Defer to has_object_permission.
        if view.__class__.__name__ == 'TaskViewSet':
            return True
            
        pk = view.kwargs.get('pk') or view.kwargs.get('project_pk')
        if pk:
            return ProjectMember.objects.filter(project_id=pk, user=request.user).exists()
        # For task views where project is embedded in the task object, allow and check per object
        return True

    def has_object_permission(self, request, view, obj):
        from apps.projects.models import ProjectMember
        # obj could be a Task or Project
        project = getattr(obj, 'project', obj)
        return ProjectMember.objects.filter(project=project, user=request.user).exists()
