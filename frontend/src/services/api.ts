import { config } from '../config';

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
}
