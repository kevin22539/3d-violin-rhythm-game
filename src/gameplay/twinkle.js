// 小星星(Twinkle Twinkle Little Star) A 大調 / 第一把位
//
// 節奏:每樂句 = 6 個四分音符 + 1 個二分音符(共 2 小節 4/4 拍)
// 旋律(6 個樂句 × 7 音 = 42 音):
//   一閃一閃亮晶晶:  A A E E F# F# E—
//   滿天都是小星星:  D D C# C# B B A—
//   掛在天上放光明:  E E D D C# C# B—
//   好像許多小眼睛:  E E D D C# C# B—
//   一閃一閃亮晶晶:  A A E E F# F# E—
//   滿天都是小星星:  D D C# C# B B A—
//   (每行最後一音以 "—" 標示,代表二分音符 = 兩拍)
//
// 第一把位指法(由 melodyPlayer 內部透過 pitchMap 反查,這裡僅供參考):
//   A4  → A 弦空弦
//   B4  → A 弦 1 指
//   C#5 → A 弦 2 指
//   D5  → A 弦 3 指
//   E5  → E 弦空弦
//   F#5 → E 弦 1 指

const QUARTER = 600;       // 四分音符 = 1 拍
const HALF    = 1200;      // 二分音符 = 2 拍
// 註:原本樂句末尾用 BREATH=200ms 製造呼吸感,但為了讓 metronome 跟譜面同步,
// 已移除。樂句結尾的 HALF(兩拍)本身就提供足夠的延音感。

function n(string, pitch, durationMs = QUARTER, gapAfterMs = 0) {
  return { string, pitch, durationMs, gapAfterMs };
}

export const TWINKLE_TWINKLE_A_MAJOR = [
  // 樂句 1:一閃一閃亮晶晶  A A E E F# F# E
  n('A', 'A4'),
  n('A', 'A4'),
  n('E', 'E5'),
  n('E', 'E5'),
  n('E', 'F#5'),
  n('E', 'F#5'),
  n('E', 'E5', HALF),

  // 樂句 2:滿天都是小星星  D D C# C# B B A
  n('A', 'D5'),
  n('A', 'D5'),
  n('A', 'C#5'),
  n('A', 'C#5'),
  n('A', 'B4'),
  n('A', 'B4'),
  n('A', 'A4', HALF),

  // 樂句 3:掛在天上放光明  E E D D C# C# B
  n('E', 'E5'),
  n('E', 'E5'),
  n('A', 'D5'),
  n('A', 'D5'),
  n('A', 'C#5'),
  n('A', 'C#5'),
  n('A', 'B4', HALF),

  // 樂句 4:好像許多小眼睛  E E D D C# C# B
  n('E', 'E5'),
  n('E', 'E5'),
  n('A', 'D5'),
  n('A', 'D5'),
  n('A', 'C#5'),
  n('A', 'C#5'),
  n('A', 'B4', HALF),

  // 樂句 5:一閃一閃亮晶晶  A A E E F# F# E
  n('A', 'A4'),
  n('A', 'A4'),
  n('E', 'E5'),
  n('E', 'E5'),
  n('E', 'F#5'),
  n('E', 'F#5'),
  n('E', 'E5', HALF),

  // 樂句 6:滿天都是小星星  D D C# C# B B A—(收尾,最後一音不加 gap)
  n('A', 'D5'),
  n('A', 'D5'),
  n('A', 'C#5'),
  n('A', 'C#5'),
  n('A', 'B4'),
  n('A', 'B4'),
  n('A', 'A4', HALF),
];