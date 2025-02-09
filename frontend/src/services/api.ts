import { config } from '../config';

interface UploadPdfRequest {
  pdfBase64: string;
  userEmail: string | undefined;
}

interface UploadPdfResponse {
  message: string;
  text: string;
  objectKey: string;
}

interface CheckRequest {
  blogContent: string;
  userEmail: string | undefined;
}

interface CheckResponse {
  message: string;
  traceId: string;
  langfuseSessionId: string;
}

interface TweetRequest {
  evalResult: string;
  userEmail: string | undefined;
  langfuseSessionId: string;
}

interface TweetResponse {
  message: string;
}

interface LoadUrlRequest {
  url: string;
  userEmail: string | undefined;
}

interface LoadUrlResponse {
  text: string;
}

export class ApiService {
  private static async makeRequest<T>(
    endpoint: string,
    method: string,
    idToken: string,
    body: any
  ): Promise<T> {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('APIエラーが発生しました');
    }

    const data = await response.json();
    return JSON.parse(data.body);
  }

  static async checkContent(
    params: CheckRequest,
    idToken: string
  ): Promise<CheckResponse> {
    return this.makeRequest<CheckResponse>(
      `${config.apiEndpoint}/check`,
      'POST',
      idToken,
      params
    );
  }

  static async generateTweet(
    params: TweetRequest,
    idToken: string
  ): Promise<TweetResponse> {
    return this.makeRequest<TweetResponse>(
      `${config.tweetApiEndpoint}/check`,
      'POST',
      idToken,
      params
    );
  }

  static async uploadPdf(
    params: UploadPdfRequest,
    idToken: string
  ): Promise<UploadPdfResponse> {
    return this.makeRequest<UploadPdfResponse>(
      `${config.loadApiEndpoint}/check`,
      'POST',
      idToken,
      params
    );
  }

  static async loadUrl(
    params: LoadUrlRequest,
    idToken: string
  ): Promise<LoadUrlResponse> {
    return this.makeRequest<LoadUrlResponse>(
      `${config.apiEndpoint}/load-url`,
      'POST',
      idToken,
      params
    );
  }
}
