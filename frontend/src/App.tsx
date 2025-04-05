import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Textarea } from "./components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs"
import { Progress } from "./components/ui/progress"
import { FeedbackButtons } from "./components/FeedbackButtons"
import { ShareButton } from "./components/ShareButton"
import { ApiService } from "./services/api"
import { useCustomAuth } from "./hooks/useAuth"
import { useState } from 'react';

// カスタムエラー型
class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

function App() {
  const [inputMode, setInputMode] = useState<'text' | 'pdf' | 'url'>('text');
  const [blogContent, setBlogContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [traceId, setTraceId] = useState('');
  const [langfuseSessionId, setLangfuseSessionId] = useState<string>('');
  const [tweetProgress, setTweetProgress] = useState(0);
  const [isTweetLoading, setIsTweetLoading] = useState(false);

  const auth = useCustomAuth();

  const startTweetProgress = () => {
    setTweetProgress(0);
    setIsTweetLoading(true);

    // プログレスバーを95%まで10秒かけて進める
    const interval = setInterval(() => {
      setTweetProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 1;
      });
    }, 100); // 10秒で100%まで進むように100msごとに1%進める
    return interval;
  };

  const stopTweetProgress = () => {
    setTweetProgress(100);
    setIsTweetLoading(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
      try {
        const text = await uploadPdf(file);
        setBlogContent(text);
      } catch (error) {
        if (error instanceof AppError || error instanceof Error) {
          setError(error.message);
        } else {
          setError('PDFファイルのアップロードに失敗しました');
        }
        setSelectedFile(null);
      }
    } else {
      setError('PDFファイルを選択してください');
      setSelectedFile(null);
    }
  };

  const uploadPdf = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        setUploadProgress(50); // ファイル読み込み完了
        try {
          const base64String = (reader.result as string).split(',')[1];
          const data = await ApiService.uploadPdf(
            {
              pdfBase64: base64String,
              userEmail: auth.user?.profile?.email
            },
            auth.user?.id_token || ''
          );
          setUploadProgress(100);
          resolve(data.text);
        } catch (error) {
          if (error instanceof Error) {
            reject(new AppError(error.message));
          } else {
            reject(new AppError('PDFファイルのアップロードに失敗しました'));
          }
        }
      };
      reader.onerror = () => {
        setIsUploading(false);
        reject(new AppError('ファイルの読み込みに失敗しました'));
      };
      reader.readAsDataURL(file);
    }).finally(() => {
      setIsUploading(false);
    });
  };

  const invokeBedrock = async () => {
    setIsLoading(true);
    setProgress(0);
    setError('');

    // プログレスバーを95%まで12秒かけて進める
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 1;
      });
    }, 200); // 20秒で100%まで進むように120msごとに1%進める
  
    try {
      let content = '';
      
      if (inputMode === 'pdf') {
        if (!blogContent) {
          throw new AppError('PDFファイルを選択してください');
        }
        content = blogContent;
      } else if (inputMode === 'url') {
        if (!blogContent) {
          throw new AppError('URLを入力してください');
        }
        try {
          // URLからコンテンツを取得
          const urlResult = await ApiService.loadUrl(
            {
              url: blogContent,
              userEmail: auth.user?.profile?.email
            },
            auth.user?.id_token || ''
          );
          
          if (!urlResult.message || urlResult.message.trim() === '') {
            throw new AppError('URLからコンテンツを取得できませんでした');
          }
          
          content = urlResult.message;
        } catch (error) {
          if (error instanceof AppError) {
            throw error;
          }
          throw new AppError('URLの読み込みに失敗しました');
        }
      } else {
        content = blogContent;
      }

      // コンテンツが空の場合はエラー
      if (!content.trim()) {
        throw new AppError('評価するコンテンツが空です');
      }

      const data = await ApiService.checkContent(
        {
          blogContent: content,
          userEmail: auth.user?.profile?.email
        },
        auth.user?.id_token || ''
      );
      
      setResponse(data.message);
      setTraceId(data.traceId);
      setLangfuseSessionId(data.langfuseSessionId);
    } catch (error) {
      if (error instanceof AppError || error instanceof Error) {
        setError(error.message);
      } else {
        setError('エラーが発生しました。ページを再読み込みして、もう一度お試しください。');
      }
    } finally {
      setProgress(100);
      setIsLoading(false);
    }
  };

  const renderAuthLoading = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              # AWSレベル判定くん
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-white">
            ⌛️ 認証中です…
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="max-w-4xl mx-auto mt-4 text-gray-400 text-sm">
        このアプリは <a href="https://x.com/minorun365" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">みのるん</a> が開発しています。（最後のデプロイ：{__DEPLOY_TIME__}）
      </div>
    </div>
  );

  const renderAuthError = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 text-white">
      <p>おや、認証失敗したようです🤔</p>
      <p>{auth.error?.message}</p>
      <Button
        onClick={auth.resetAuth}
        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
      >
        もっかいサインインしてみる
      </Button>
    </div>
  );
  
  const renderAuthenticatedContent = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* <div className="text-white text-right">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              auth.signOut();
            }}
            className="text-white hover:text-gray-300 cursor-pointer"
          >
            サインアウト
          </a>
        </div> */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              # AWSレベル判定くん
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-4">
              <p className="text-white">
                あなたの技術アウトプットを入力してください。賢いAIがレベルを分析します。
              </p>
              
              <Tabs
                value={inputMode}
                onValueChange={(value) => {
                  setInputMode(value as 'text' | 'pdf' | 'url');
                  setError('');
                  setBlogContent('');
                  setSelectedFile(null);
                }}
                className="w-full"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="text" className="flex-1">テキスト</TabsTrigger>
                  <TabsTrigger value="url" className="flex-1">URL</TabsTrigger>
                  <TabsTrigger value="pdf" className="flex-1">PDF</TabsTrigger>
                </TabsList>

                <TabsContent value="text">
                  <Textarea
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="評価したいブログや登壇資料の内容を、テキスト形式でここにコピペしてね"
                    className="min-h-[200px] bg-gray-700 text-white border-gray-600 placeholder:text-gray-300"
                  />
                </TabsContent>

                <TabsContent value="url">
                  <Textarea
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="評価したいページのURLを入力してね（1件のみ）"
                    className="min-h-[100px] bg-gray-700 text-white border-gray-600 placeholder:text-gray-300"
                  />
                </TabsContent>

                <TabsContent value="pdf">
                  <div className="flex flex-col items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <p className="mb-2 text-sm text-white">
                          {selectedFile ? selectedFile.name : 'PDFファイルをドロップしてね'}
                        </p>
                        <p className="text-xs text-gray-400">
                          PDF (最大5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                    {isUploading && (
                      <div className="w-full mt-4">
                        <div className="text-sm text-white mb-2 text-center">
                          PDFファイルをアップロード中...
                        </div>
                        <Progress value={uploadProgress} />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="w-full">
              <Button
                onClick={invokeBedrock}
                disabled={isLoading || isUploading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? "⌛️ 分析中…" : "Amazon Bedrockに判定してもらう！"}
              </Button>
              {isLoading && (
                <Progress value={progress} className="w-full mt-4" />
              )}
            </div>

            {error && (
              <p className="text-pink-500">
                {error}
              </p>
            )}

            {response && (
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="pt-4">
                  {response.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-white mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </CardContent>
                <div className="p-4">
                  <div className="flex gap-2">
                    <ShareButton
                      response={response}
                      userEmail={auth.user?.profile?.email}
                      langfuseSessionId={langfuseSessionId}
                      idToken={auth.user?.id_token || ''}
                      onError={setError}
                      onLoadingStart={startTweetProgress}
                      onLoadingEnd={stopTweetProgress}
                    />
                    <FeedbackButtons traceId={traceId} />
                  </div>
                  {isTweetLoading && (
                    <Progress value={tweetProgress} className="w-full mt-4" />
                  )}
                </div>
              </Card>
            )}

            <p className="text-gray-400 text-sm">
              評価基準は以下です。判定結果はあくまで参考程度に活用ください。
            </p>
            <ul className="list-disc pl-4 space-y-1 text-gray-400 text-sm">
              <li>Level 100 : AWS サービスの概要を解説するレベル</li>
              <li>Level 200 : トピックの入門知識を持っていることを前提に、ベストプラクティス、サービス機能を解説するレベル</li>
              <li>Level 300 : 対象のトピックの詳細を解説するレベル</li>
              <li>Level 400 : 複数のサービス、アーキテクチャによる実装でテクノロジーがどのように機能するかを解説するレベル</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <div className="max-w-4xl mx-auto mt-4 text-gray-400 text-sm">
        このアプリは <a href="https://x.com/minorun365" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">みのるん</a> が開発しています。（最後のデプロイ：{__DEPLOY_TIME__}）
      </div>
    </div>
  );

  const renderUnauthenticatedContent = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              # AWSレベル判定くん
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-white">
              このサービスは、2025年4月4日をもって終了しました。
              登録いただいたメールアドレスは、速やかに削除させていただきます。
              たくさんの方にご愛用いただき、ありがとうございました！
              <br /><br />
              ソースコードは以下に公開していますので、みなさんの環境でもデプロイすることが可能です。
              <br />
              <li className="text-blue-400 hover:text-blue-300">
                <a href="https://github.com/minorun365/aws-level-checker">
                  github.com/minorun365/aws-level-checker
                </a>
              </li>
              <br /><br />
              このアプリケーションに関するご質問などは、XのDMまでご連絡ください。
              <br />
              <li className="text-blue-400 hover:text-blue-300">
                <a href="https://x.com/minorun365">
                  @minorun365
                </a>
              </li>
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="max-w-4xl mx-auto mt-4 text-gray-400 text-sm">
        このアプリは <a href="https://x.com/minorun365" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">みのるん</a> が開発しています。（最後のデプロイ：{__DEPLOY_TIME__}）
      </div>
    </div>
  );

  if (auth.isLoading) {
    return renderAuthLoading();
  }

  if (auth.error) {
    return renderAuthError();
  }

  return auth.isAuthenticated
    ? renderAuthenticatedContent()
    : renderUnauthenticatedContent();
}

export default App;
