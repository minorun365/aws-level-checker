import os
from langfuse import Langfuse
 
# Langfuseクライアントの初期化
langfuse = Langfuse(
    public_key=os.environ["LANGFUSE_PUBLIC_KEY"],
    secret_key=os.environ["LANGFUSE_SECRET_KEY"],
    host=os.environ["LANGFUSE_HOST"]
)

# カレントディレクトリ内のtxtファイルを取得
txt_files = [f for f in os.listdir('.') if f.endswith('.txt')]

# 各txtファイルを読み込んで、Langfuseのプロンプトを更新
for txt_file in txt_files:
    prompt_name = txt_file.replace('.txt', '')
    langfuse.create_prompt(
        name=prompt_name,
        type="text",
        prompt=open(txt_file).read(),
        labels=["production"]
    )
