import boto3, json, os, requests
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_aws import ChatBedrockConverse
from langfuse.decorators import observe
from langfuse.callback import CallbackHandler

def create_response(status_code, message):
    return {
        "statusCode": status_code,
        "body": json.dumps(message)
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
        user_id=event.get("userEmail"),
        session_id=event.get("langfuseSessionId")
    )

    try:
        if not event.get("evalResult"):
            return create_response(400, {
                    "message": "アウトプットの内容が入力されていないようです🤔"
                }
            )

        prompt = ChatPromptTemplate.from_template("""
以下は、このアプリの利用者が自分の技術アウトプットを評価した結果です。
これをXでつぶやいてアプリの利用拡大につながるよう、100文字以内のツイート文言にまとめてください。

<評価結果>
{eval_result}
</評価結果>

以下の例に沿って、なるべく xxx の部分だけを変更してください。

<ツイート文言の例>
#AWSレベル判定くん でxxxに関するアウトプットを評価してみたら、Level xxxでした！ みんなも使ってみてね。
https://checker.minoruonda.com/
</ツイート文言の例>

ただし「はい、分かりました。ツイート文言を生成します」といった前置きは不要です。
ツイート文言そのものだけを出力してください。""")
        chain = prompt | llm | StrOutputParser()
        output = chain.invoke(
            input={"eval_result": event.get("evalResult")},
            config={
                "run_name": "Tweet Generation",
                "callbacks": [langfuse_handler]
            }
        )
        langfuse_handler.flush()
        
        return create_response(200, {
            "message": output,
            "traceId": langfuse_handler.get_trace_id()
        })

    except Exception as e:
        return create_response(500, {
            "message": f"エラーが発生しました: {str(e)}"
        })
