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
  message: string;
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
      const errorData = await response.json();
      throw new Error(errorData.message || 'APIエラーが発生しました');
    }

    const data = await response.json();
    return data as T;
  }

  static async checkContent(
    params: CheckRequest,
    idToken: string
  ): Promise<CheckResponse> {
    return this.makeRequest<CheckResponse>(
      `${config.apiEndpoint}/evaluate`,
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
      `${config.apiEndpoint}/tweet`,
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
      `${config.apiEndpoint}/load-pdf`,
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
