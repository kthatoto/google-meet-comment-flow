## 開発者向け案内

この拡張機能は Google Meet で画面共有して発表する際などに、チャットのコメントをニコニコ動画風に流すツールになります。

### local で試す方法

この Project を clone します。

`npm install`

`npm run build`

これにより、`/dist`が作成されます。

`chrome://extensions/` = 拡張機能管理ページを開き、右上の「デベロッパー モード」ボタンを ON

「パッケージ化されていない拡張機能を読みこむ」にて`/dist`フォルダーを選択。
これにより拡張機能が有効化されます。

### 動作方法

まず適当に Google Meet を一つ開きます。
Google Meet の画面を起動するとデフォルトで有効化されるようになっています。

右上の拡張機能設定から色と大きさを選択できます。

<img width="361" height="394" alt="image" src="https://github.com/user-attachments/assets/2342695f-0564-4d3c-9e36-79d7a06e6328" />

<img width="362" height="206" alt="image" src="https://github.com/user-attachments/assets/8d0a338a-d9e5-415c-b9d0-68a3451e3f61" />

動作のためには、下記画像左側のようにチャット欄を一回開く必要があります。チャット欄を一度開くことで初めてコメントの DOM が反映されるようになります。

ここでコメントを送信すると、focus しているchromeタブ上に流れるようになります。
チャット欄が Pop up の場合でも動作します。

一人で動作確認する場合は別アカウント、別デバイスで Meet に入り、他人としてコメントを再現すると良いでしょう。
<img width="2540" height="1395" alt="image" src="https://github.com/user-attachments/assets/c4f23de2-f9a6-4097-bfab-bd714ee59254" />

<details>

<summary>Fork元のreadme</summary>

# Google Meet Comment Flow

## 👀 Features

Google Meet のコメントを画面上に流すことができる拡張機能です。

This is the Chrome Extension, which enables Google Meet comments to flow on the screen.

## 📦 Install

以下からインストールできます

You can install the extension from the link below

https://chrome.google.com/webstore/detail/google-meet-comment-flow/nfhfbmbjgdkblicdmdplioanaochdhih

## 💻 Usage

### How to flow comments

Google Meet でコメント欄を開いておくと、フォーカスしているタブでコメントが流れます。

Google Slide でのプレゼンテーションにも対応しております。

If you open the comment field in Google Meet, the posted comments will flow on the currently focused tab.

This extension is also available on the presentation with Google Slide.

### Settings

設定用ポップアップで以下の変更ができます。

- コメントの文字の大きさ(デフォルトは M)
- コメントの色(デフォルトは黒)
- コメントが流れるかどうか(デフォルトでは流れないようになっております)

You change the settings below in popup:

- font size of comments(default: M)
- color of comments(default: black)
- whether comments flow or not(default: not flow)

## 👨‍💻 Contributing

Issue, Pull Request など Contribution は大歓迎です！

Contributions are welcome 🎉
You can contribute via Issues, Pull Requests and so on.

## 💕 Thanks

この拡張機能は以下を参考に作成しました！

This extension is inspired by the extensions below.

- [NicoStyleMeet](https://github.com/Yeq6X/NicoStyleMeet)
- [NicoNicoStyle4MeetChromeExtension](https://github.com/Z-me/NicoNicoStyle4MeetChromeExtension)

</details>
