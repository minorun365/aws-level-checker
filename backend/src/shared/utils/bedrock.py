import boto3
import json
import os

def get_bedrock_client():
    """Bedrockクライアントを取得する"""
    session = boto3.Session()
    bedrock = session.client(
        service_name='bedrock-runtime',
        region_name='us-east-1'
    )
    return bedrock

def invoke_model(prompt, model_id="anthropic.claude-v2"):
    """Bedrockモデルを呼び出す"""
    bedrock = get_bedrock_client()
    
    body = json.dumps({
        "prompt": prompt,
        "max_tokens_to_sample": 2000,
        "temperature": 0,
        "top_p": 1,
    })

    response = bedrock.invoke_model(
        body=body,
        modelId=model_id,
        accept='application/json',
        contentType='application/json'
    )

    response_body = json.loads(response.get('body').read())
    return response_body.get('completion')
