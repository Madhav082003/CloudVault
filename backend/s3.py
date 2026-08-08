import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
from config import AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
    config=Config(signature_version="s3v4"),
)

def upload_file_to_s3(file_bytes: bytes, s3_key: str, content_type: str = "application/octet-stream"):
    s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=s3_key,
        Body=file_bytes,
        ContentType=content_type,
    )

def generate_presigned_url(s3_key: str, expiry: int = 3600) -> str:
    url = s3_client.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_BUCKET_NAME, "Key": s3_key},
        ExpiresIn=expiry,
    )
    return url

def delete_file_from_s3(s3_key: str):
    try:
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
    except ClientError:
        pass
