import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class MinIOStorage(S3Boto3Storage):
    """Custom storage backend for MinIO (S3-compatible)."""
    querystring_auth = True
    file_overwrite = False


def generate_presigned_url(file_path: str, expiry: int = 3600) -> str | None:
    """
    Generate a presigned URL for a MinIO object key.

    Args:
        file_path: The object key (path) within the bucket.
        expiry: URL expiry in seconds (default 3600 = 1 hour).

    Returns:
        Presigned URL string, or None on failure.
    """
    if not file_path:
        return None
    try:
        s3_client = boto3.client(
            's3',
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            verify=False,
        )
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'Key': file_path,
            },
            ExpiresIn=expiry,
        )
        return url
    except ClientError:
        return None
