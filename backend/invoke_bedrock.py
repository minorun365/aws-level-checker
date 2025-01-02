import boto3, json, os, requests
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_aws import ChatBedrockConverse
from langfuse.decorators import observe
from langfuse.callback import CallbackHandler

def get_cors_headers():
    return {
        "Access-Control-Allow-Origin": os.environ["ALLOWED_ORIGIN"],
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
    headers = {"X-Aws-Parameters-Secrets-Token": os.environ.get('AWS_SESSION_TOKEN')}
    secrets_extension_endpoint = os.environ["LANGFUSE_SECRET_URL"]
    r = requests.get(secrets_extension_endpoint, headers=headers)
    secret = json.loads(r.text)["SecretString"]
    
    if isinstance(secret, str):
        secret = json.loads(secret)

    llm = ChatBedrockConverse(
        model=os.environ["BEDROCK_INFERENCE_PROFILE_ARN"],
        max_tokens=4096,
    )

    langfuse_handler = CallbackHandler(
        secret_key=secret.get("LANGFUSE_SECRET_KEY"),
        public_key=secret.get("LANGFUSE_PUBLIC_KEY"),
        host=os.environ["LANGFUSE_HOST"],
    )

    try:
        if not event.get("blogContent"):
            return create_response(400, "アウトプットの内容が入力されていないようです🤔")

        prompt = ChatPromptTemplate.from_template("""
あなたはAWS社のソリューションアーキテクトです。以下のコンテンツ（ブログもしくは登壇資料）のAWS技術レベルを判定してください。

ただし、もしコンテンツ内容のテキストではなく、単一のURLが入力された場合は
「URLの読み込みには対応していません。内容をコピペして送信してね🙏」と返してください。

<評価基準>
Level 100 : AWS サービスの概要を解説するレベル
Level 200 : トピックの入門知識を持っていることを前提に、ベストプラクティス、サービス機能を解説するレベル
Level 300 : 対象のトピックの詳細を解説するレベル
Level 400 : 複数のサービス、アーキテクチャによる実装でテクノロジーがどのように機能するかを解説するレベル
</評価基準>

<コンテンツ>
{blog_content}
</コンテンツ>""")
        chain = prompt | llm | StrOutputParser()
        output = chain.invoke(
            input={"blog_content": event.get("blogContent")},
            config={
                "run_name": "AWS Level Checker",
                "callbacks": [langfuse_handler],
                "metadata": {
                    "user_email": event.get("userEmail")
                }
            }
        )
        langfuse_handler.flush()
        
        return create_response(200, output)

    except Exception as e:
        return create_response(500, f"エラーが発生しました: {str(e)}")
