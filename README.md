# ボクセラミング拡張機能

### ゲームモードでのサイズ変換の覚書

- スクラッチの画面サイズは480x360
- ボクセラミングの標準スプライトサイズは、画面高さの8分の1とする
- スプライトの画像サイズは128px
- したがって、スクラッチで大きさを35にすると、画面のサイズに対して、128 x 0.35 / 360 = 0.1244444 となる（ほぼ8分の1）

ここまでで、スクラッチの画面サイズに対して、スプライトサイズが8分の1になるように設定されている。

次は、ボクセラミングのスプライトサイズの計算を行う。

- ボクセラミングの画面サイズは、縦64センチになるようにする。
- そのためには、画面サイズに　64 / 360 = 0.17777777777777778 の係数を掛ければ良い。
- 次に、スプライトの送信スケールを1にする。
- そのために、1 / 35の係数を掛ければ良い。

<p align="center"><img src="https://creativival.github.io/voxelamming/image/turtle_cage.png" alt="turtle_cage" width="50%"/></p>

[Xcratch](https://xcratch.github.io/)用のボクセラミング拡張機能

*Read this in other languages: [English](README.en.md), [日本語](README.md)*

## ボクセラミングとは

ボクセラミング = ボクセル + プログラミング

ボクセラミングはARKitを利用したプログラミング学習アプリです。ARKit互換のiPhoneおよびiPad（iOS 13以上）で無料で使用できます。コンピュータ上でプログラムされたボクセル（3D空間におけるピクセルの立方体相当）を仮想空間に配置して楽しむことができます。

詳細については、以下のサイトを参照してください。https://creativival.github.io/voxelamming

## ✨ この拡張機能で何ができるのか

ボクセラミング拡張機能で何ができるのかを確認するために、サンプルプロジェクトを再生してみてください。

[サンプルプロジェクト](https://xcratch.github.io/editor/#https://creativival.github.io/voxelamming-extension/projects/example.sb3)

<iframe src="https://xcratch.github.io/editor/player#https://creativival.github.io/voxelamming-extension/projects/example.sb3" width="540px" height="460px"></iframe>

## Xcratchでの使用方法

この拡張機能は、Xcratchの他の拡張機能と一緒に使用できます。
1.  [Xcratch Editor](https://xcratch.github.io/editor)を開く
2. 左下の '拡張機能を追加' ボタンをクリックする
3. '拡張機能を読み込む' エクステンションを選択する
4. 入力フィールドにモジュールURLを入力する
```
https://creativival.github.io/voxelamming-extension/dist/voxelamming.mjs
```

* この拡張機能は「ボクセラミングタートル」拡張機能と同時には使えません。

## ボクセラミングタートル拡張機能について

ボクセラミングタートル拡張機能は、より直感的なプログラミングが可能であり、ボクセラミングの入門として、低学年の子供たち、プログラミング初心者のために開発されました。

ボクセラミングタートル拡張機能は、タートルグラフィックスと呼ばれる図形描画ツールを提供します。 タートルグラフィックスは物理的な「亀」（ペンを持った小さなロボット）を想定します。亀は、前進、後退、左に回転、右に回転、ペンを上げる、ペンを下ろすなどの命令を受け取り、それに従って動きます。亀は、ペンを下ろしている間に移動した場所に線を描きます。タートルグラフィックスは、亀が描いた線を表示することで、亀の動きを可視化します。

ボクセラミングタートル拡張機能については、以下のサイトを参照してください。https://creativival.github.io/voxelamming-turtle-extension/

## 開発

[README.md](README.md)

### ローカルのXcratchに登録

テストのためにこの拡張機能をローカルのXcratchにインストールするために、登録スクリプトを実行します。

```
npm run register
```

### モジュールにバンドルする

この拡張機能をXcratchで読み込むことができるモジュールファイルにバンドルするために、ビルドスクリプトを実行します。

```
npm run build
```

## 🏠 ホームページ

このページはここから開けます https://creativival.github.io/voxelamming-extension/

## 🤝 貢献

貢献、問題、機能リクエストは大歓迎です！<br />お気軽に[issues page](https://github.com/https://creativival/voxelamming-extension/issues)をチェックしてみてください。
