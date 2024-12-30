import boto3, json, os

ALLOWED_ORIGIN = os.environ["ALLOWED_ORIGIN"]
BEDROCK_INFERENCE_PROFILE_ARN = os.environ["BEDROCK_INFERENCE_PROFILE_ARN"]

def get_cors_headers():
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
        "Access-Control-Allow-Credentials": "true"
    }

def create_response(status_code, message):
    return {
        "statusCode": status_code,
        "headers": get_cors_headers(),
        "body": json.dumps({"message": message})
    }

def lambda_handler(event, context):
    try:            
        blog_content = event.get("blogContent")
        if not blog_content:
            return create_response(400, "アウトプットの内容が入力されていないようです🤔")

        client = boto3.client("bedrock-runtime", region_name="us-east-1")
        user_message = f"""
あなたはAWS社のソリューションアーキテクトです。以下のブログのAWSレベルを判定してください。
ただし、もしブログ内容のテキストではなく、単一のURLが入力された場合は
「URLの読み込みには対応していません。内容をコピペして送信してね🙏」と返してください。

<評価基準>
Level 100 : AWS サービスの概要を解説するレベル
Level 200 : トピックの入門知識を持っていることを前提に、ベストプラクティス、サービス機能を解説するレベル
Level 300 : 対象のトピックの詳細を解説するレベル
Level 400 : 複数のサービス、アーキテクチャによる実装でテクノロジーがどのように機能するかを解説するレベル
</評価基準>

<ブログ>
{blog_content}"""
        
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "text": user_message,
                    }
                ],
            }
        ]

        response = client.converse(
            modelId=BEDROCK_INFERENCE_PROFILE_ARN,
            messages=messages,
            inferenceConfig={
                "maxTokens": 4096,
            },
        )

        output = response["output"]["message"]["content"][0]["text"]        
        return create_response(200, output)

    except Exception as e:
        return create_response(500, f"エラーが発生しました: {str(e)}")