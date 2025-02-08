import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Textarea } from "./components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group"
import { Progress } from "./components/ui/progress"
import { FeedbackButtons } from "./components/FeedbackButtons"
import { ShareButton } from "./components/ShareButton"
import { ApiService } from "./services/api"
import { useCustomAuth } from "./hooks/useAuth"
import { useState } from 'react';

function App() {
  const [inputMode, setInputMode] = useState<'text' | 'pdf'>('text');
  const [blogContent, setBlogContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError('');
    } else {
      setError('PDFファイルを選択してください');
      setSelectedFile(null);
    }
  };

  const uploadPdf = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const data = await ApiService.uploadPdf(
            {
              pdfBase64: base64String,
              userEmail: auth.user?.profile?.email
            },
            auth.user?.id_token || ''
          );
          resolve(data.text);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => {
        reject(new Error('ファイルの読み込みに失敗しました'));
      };
      reader.readAsDataURL(file);
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
    }, 120); // 12秒で100%まで進むように120msごとに1%進める
  
    try {
      let content = '';
      
      if (inputMode === 'pdf') {
        if (!selectedFile) {
          setError('PDFファイルを選択してください');
          return;
        }
        content = await uploadPdf(selectedFile);
      } else {
        content = blogContent;
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
      setError('エラーが発生しました。ページを再読み込みして、もう一度お試しください。');
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
        <div className="text-white text-right">
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
        </div>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              # AWSレベル判定くん
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-4">
              <p className="text-white">
                あなたのアウトプットを入力してください。賢いAIがレベルを分析します。
              </p>
              
              <RadioGroup
                value={inputMode}
                onValueChange={(value) => {
                  setInputMode(value as 'text' | 'pdf');
                  setError('');
                  setBlogContent('');
                  setSelectedFile(null);
                }}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="text" />
                  <label htmlFor="text" className="text-white cursor-pointer">テキストを入力</label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pdf" id="pdf" />
                  <label htmlFor="pdf" className="text-white cursor-pointer">PDFをアップロード</label>
                </div>
              </RadioGroup>

              {inputMode === 'text' ? (
                <Textarea
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              placeholder={`評価したいブログや登壇資料の内容を、テキスト形式でここにコピペしてね
（URLを入れてもページを読みに行くことはできません）`}
              className="min-h-[200px] bg-gray-700 text-white border-gray-600 placeholder:text-gray-300"
                />
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <p className="mb-2 text-sm text-white">
                        {selectedFile ? selectedFile.name : 'PDFファイルをドロップするか、クリックして選択'}
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF (最大10MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="application/pdf"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="w-full">
              <Button
                onClick={invokeBedrock}
                disabled={isLoading}
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
              あなたの技術アウトプットのAWSレベルを判定します。
            </p>
            <Button
              onClick={auth.signIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              サインインしてはじめよう！
            </Button>
            <p className="text-gray-400 text-sm">
              ⚠️ このアプリの利用にあたり、メールアドレスを登録いただきます。登録されたメールアドレスは、アプリケーション利用状況のモニタリングならびに、常軌を逸した想定外利用などのトラブル発生時における個別連絡のために利用させていただくことがあります。その他、マーケティングなどの目的で使われたり、開発者以外の第三者へ共有されることはありません。
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
