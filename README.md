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

### 2025/11/21 時点での動作方法

まず適当に Google Meet を一つ開きます。一人で動作確認する場合は別アカウント、別デバイスで Meet に入ります。

右上の拡張機能を ON にします。色と大きさを選択できます。

<img width="361" height="394" alt="image" src="https://github.com/user-attachments/assets/2342695f-0564-4d3c-9e36-79d7a06e6328" />

<img width="362" height="206" alt="image" src="https://github.com/user-attachments/assets/8d0a338a-d9e5-415c-b9d0-68a3451e3f61" />

この時点でチャットを送信すると、Meet 画面上に流れるようになります。
注意点として Meet の画面上でチャット欄を開いている状態にする必要があります。おそらく DOM が読み込めなくなるため。下記画像参照。

画面共有上で流すには、下記画像のように、Meet の画面と発表画面を別ウィンドウにして表示します。

この状態で画面共有 → 発表画面に focus することで発表画面の Chrome ウィンドウ上に流れるようになります。
focus している Chrome ウィンドウ上に流れます。

<img width="2540" height="1395" alt="image" src="https://github.com/user-attachments/assets/c4f23de2-f9a6-4097-bfab-bd714ee59254" />

他にも、色々な諸条件で動いたり動かなかったりするので留意ください。その際は色々なパターンで試してみてください。（要メンテ）
例えば Meet のコメント欄が Pop up した場合が動かないなど。

最終目標は拡張機能を公開して誰でも簡単に利用できるようにすること。

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
