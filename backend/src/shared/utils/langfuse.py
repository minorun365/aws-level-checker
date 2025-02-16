import os
import json
import boto3
from langfuse import Langfuse

def get_langfuse_client():
    """Langfuseクライアントを取得する"""
    # SecretsManagerからLangfuseの認証情報を取得
    secrets_client = boto3.client('secretsmanager')
    secret_response = secrets_client.get_secret_value(
        SecretId=os.environ['LANGFUSE_SECRET_NAME']
    )
    secret = json.loads(secret_response['SecretString'])
    
    # Langfuseクライアントを初期化
    langfuse = Langfuse(
        public_key=secret['public_key'],
        secret_key=secret['secret_key'],
        host=os.environ['LANGFUSE_HOST']
    )
    return langfuse

def log_generation(name, input_text, output_text, metadata=None):
    """生成結果をLangfuseに記録する"""
    langfuse = get_langfuse_client()
    
    generation = langfuse.generation(
        name=name,
        input=input_text,
        output=output_text,
        metadata=metadata or {}
    )
    generation.flush()
    return generation.id
