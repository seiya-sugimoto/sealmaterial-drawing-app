<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`



===
Google AI Studio が生成したプロジェクトは Next.js（Node.js を使う Web アプリ） です。

README の内容を分解するとこうなります。

① Node.js が必要

あなたの PC（Windows / Mac）に Node.js が入っていないと動きません。

入れてない → https://nodejs.org/
 から LTS をインストール

すでに入ってる → OK

② 依存パッケージをインストール

プロジェクトを zip でダウンロードしたフォルダに移動して、

npm install


を実行すると、必要なライブラリが全部インストールされます。

③ Gemini API Key をセットする

Google AI Studio のアプリは、裏で Gemini API（LLM）を呼ぶ部分があるため、APIキーが必要。

.env.local というファイルを作って、こう書きます：

GEMINI_API_KEY=あなたのAPIキー

④ アプリをローカルで起動
npm run dev


これで開発用サーバーが起動します。

http://localhost:3000

でアプリを開けるようになります。