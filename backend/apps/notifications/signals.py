import re
from django.db.models import Q
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.accounts.models import User
from apps.projects.models import ProjectMember
from apps.tasks.models import Task


def extract_text_from_json(val) -> str:
    """Recursively extract all text values from a Tiptap JSON-like structure or string."""
    if isinstance(val, str):
        return val
    
    texts = []
    def traverse(node):
        if isinstance(node, dict):
            if 'text' in node and isinstance(node['text'], str):
                texts.append(node['text'])
            for v in node.values():
                traverse(v)
        elif isinstance(node, list):
            for item in node:
                traverse(item)
                
    traverse(val)
    return " ".join(texts)


def parse_mentions(description) -> list:
    """
    Extract mentioned handles from text.
    Matches patterns like @someone or @user@example.com.
    Returns a list of raw strings after the @ symbol.
    """
    text = extract_text_from_json(description)
    return re.findall(r'@(\S+)', text or '')


def _build_user_query(emails: list, names: list) -> Q:
    """Build a Q object matching users by email or full_name."""
    q = Q()
    for email in emails:
        q |= Q(email__iexact=email)
    for name in names:
        q |= Q(full_name__icontains=name)
    return q


@receiver(post_save, sender=Task)
def notify_mentioned_users(sender, instance, created, **kwargs):
    """
    After a Task is saved, scan the description for @mentions.
    For each mention that resolves to a verified project member, create a Notification.
    """
    from apps.notifications.models import Notification

    mentions = parse_mentions(instance.description)
    if not mentions:
        return

    # Heuristic: tokens containing '.' are likely emails; others are name fragments
    mentioned_emails = [m for m in mentions if '.' in m]
    mentioned_names = [m for m in mentions if m not in mentioned_emails]

    q = _build_user_query(mentioned_emails, mentioned_names)
    if not q:
        return

    matching_users = User.objects.filter(q)

    project_member_user_ids = set(
        ProjectMember.objects.filter(
            project=instance.project,
            user__in=matching_users,
        ).values_list('user_id', flat=True)
    )

    for user in matching_users.filter(id__in=project_member_user_ids):
        Notification.objects.get_or_create(
            recipient=user,
            task=instance,
            defaults={'message': f"You were mentioned in '{instance.title}'"},
        )
