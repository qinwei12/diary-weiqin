import { themeFromPalette } from "./colors";
import { DEFAULT_THEME } from "./site";
import type { Post, PostImage } from "./types";

function image(
  url: string,
  width: number,
  height: number,
  alt: string,
  palette: string[],
): PostImage {
  return {
    url,
    width,
    height,
    alt,
    palette,
    accent: themeFromPalette(palette).accent,
  };
}

const windowArt = image(
  "/images/illustration-window.webp",
  1200,
  900,
  "一幅橘色插画：拱形窗外是落日，窗边有一盆绿植和一杯热茶",
  ["#e07c59", "#f1e8db", "#b1593e", "#fdc39c", "#28201c", "#d3c3b1"],
);

const teaArt = image(
  "/images/illustration-tea.webp",
  1200,
  900,
  "一幅插画：摊开的书、桂花乌龙茶和几粒散落的桂花",
  ["#ed7f59", "#f1e5d4", "#4b423c", "#a49c94", "#d5c6b3", "#6c635c"],
);

const avatarArt = image(
  "/images/avatar.webp",
  800,
  800,
  "橙发女孩的方形头像，耳边别着一朵橙色雏菊",
  ["#f48251", "#000000", "#feebe2", "#c45635", "#352c2b", "#fec9bb"],
);

const stickerArt = image(
  "/images/sticker.webp",
  900,
  900,
  "橙发女孩的贴纸风插画，白色背景",
  ["#ef7e57", "#fefefe", "#cc5a3a", "#1e1b1a", "#fddeda", "#423d3d"],
);

const heroArt = image(
  "/images/hero.webp",
  937,
  1678,
  "穿橙白长裙、手捧旧书的橙发女孩全身像",
  ["#cc6b43", "#e3ccc3", "#3c2c2a", "#bc9d93", "#a4533a", "#93746b"],
);

const portraitArt = image(
  "/images/portrait.webp",
  760,
  892,
  "橙发女孩的半身像，浅色背景",
  ["#cc6b43", "#e3cbc3", "#9c4b33", "#332523", "#c4a59b"],
);

const dressArt = image(
  "/images/dress.webp",
  760,
  712,
  "橙白相间、缀着黑色缎带与流苏的裙摆特写",
  ["#cb5c35", "#e4ccc3", "#332624", "#bb9c93", "#94746b"],
);

type SeedPost = Omit<Post, "theme">;

const seedPosts: SeedPost[] = [
  {
    id: "2026-10-27-dusk",
    title: "黄昏是橘子味的",
    content: `今天什么也没赶，只是把椅子挪到了窗边。

夕阳 **落在书页上**，像有人把蜂蜜慢慢倒进房间。橘色的光从桌角爬到杯沿，连空气都变得软软的。

> 原来一天里最安静的时刻，是光在退场之前。

做了三件小事：

- 给窗台的罗勒浇了水
- 把耳机里的歌单换成了秋天
- 认真吃完一整个柿子

[那天穿的裙子](/posts/2026-10-16-orange-dress)还挂在椅背上，橙色被夕阳照得更暖了一点。

明天也要记得，慢一点也没关系。`,
    images: [windowArt, stickerArt],
    mood: "🍊",
    weather: "晴 18°",
    location: "窗边",
    tags: ["日常", "黄昏", "橘子"],
    createdAt: "2026-10-27T21:40:00+08:00",
    updatedAt: null,
    pinned: true,
    likes: 12,
  },
  {
    id: "2026-10-25-old-book",
    title: "在旧书页里拾到一枚秋天",
    content: `## 一本旧书的旅行

在旧书店最里面那排书架上，摸到一本 1998 年的《小王子》。扉页上有一行褪色的铅笔字：

> 给十八岁的阿澄，愿你看完第四十四次日落，仍然相信玫瑰。

我没有买下它，只是在原地站了一会儿，把这句话偷偷记住了。

回来的路上一直在想，**书会等人，句子也会。** 它们安静地待在纸页里，等某一天被另一双眼睛重新点亮。

- 刚读完：《夜晚的潜水艇》，最喜欢的还是《竹峰寺》
- 在读：《我们仨》
- 想买：一枚小小的黄铜书签

书页上还留着一股旧纸和阳光混在一起的味道，像一间很久没人打开的房间。`,
    images: [heroArt],
    mood: "📖",
    weather: "阴 16°",
    location: "旧书店",
    tags: ["阅读", "秋天"],
    createdAt: "2026-10-25T23:12:00+08:00",
    updatedAt: null,
    pinned: false,
    likes: 8,
  },
  {
    id: "2026-10-23-flower",
    title: "把自己装进一朵花里",
    content: `画了新的头像，一朵橙色的小雏菊别在耳边。

朋友说看起来像一颗刚剥开的橘子，酸酸的，又很甜。我很喜欢这个比喻。

最近在练习一件小事：**不急着解释自己。**

花不会解释自己为什么是橙色，它只是开着。`,
    images: [avatarArt],
    mood: "🌼",
    weather: "多云 17°",
    location: "书桌前",
    tags: ["手绘", "碎碎念"],
    createdAt: "2026-10-23T00:27:00+08:00",
    updatedAt: null,
    pinned: false,
    likes: 15,
  },
  {
    id: "2026-10-20-rain-cat",
    title: "下雨天，和一只慢吞吞的猫",
    content: `楼下便利店门口来了一只三花猫。下雨天也不躲，就蹲在纸箱上，慢吞吞地舔爪子。

我蹲下来和它对视了大概三分钟。它先移开眼睛，然后打了个哈欠——像是在说，好了，今天到此为止。

回家煮了一碗热汤面，加了两颗青菜和一个溏心蛋。

**雨天清单**

1. 不穿白鞋
2. 带一把够大的伞
3. 给路边的猫留一点时间

雨声把城市调成了静音模式。今晚适合早睡。`,
    images: [],
    mood: "🐈",
    weather: "小雨 15°",
    location: "家",
    tags: ["雨天", "猫"],
    createdAt: "2026-10-20T19:05:00+08:00",
    updatedAt: null,
    pinned: false,
    likes: 5,
  },
  {
    id: "2026-10-16-orange-dress",
    title: "橙色的裙摆",
    content: `新裙子到了。橙色、奶油白、黑色缎带，像把一整个秋天穿在身上。

转圈的时候，裙摆会开成一朵花。小时候也有一条这样的裙子，每次去公园都要穿，走路一定要走最中间的石板。

长大以后，好像很少这样明目张胆地开心了。

所以今天决定：**为一条裙子开心一整天。**

翻出很久以前的头像放在一起看，像同一颗橘子的两个季节。`,
    images: [dressArt, portraitArt],
    mood: "✨",
    weather: "晴 21°",
    location: "卧室",
    tags: ["穿搭", "秋天", "小确幸"],
    createdAt: "2026-10-16T07:30:00+08:00",
    updatedAt: null,
    pinned: false,
    likes: 21,
  },
  {
    id: "2026-10-10-new-avatar",
    title: "换了一枚新头像",
    content: `把用了三年的头像换掉了。

旧头像是一只背对镜头的兔子，新头像是一个橙头发的女孩。换完以后，主页忽然像换了一间房间。

有些改变不需要理由，只是某天醒来，想看见一个新的自己。`,
    images: [avatarArt],
    mood: "🌿",
    weather: "夜风 19°",
    location: "家",
    tags: ["记录", "碎碎念"],
    createdAt: "2026-10-10T01:00:00+08:00",
    updatedAt: null,
    pinned: false,
    likes: 9,
  },
  {
    id: "2026-09-28-tea",
    title: "桂花乌龙与一本没读完的书",
    content: `下午三点，泡了一杯桂花乌龙。

茶包是上个月在街角小店买的，老板说“秋天要喝一点甜的香”。果然，热水一冲，整间屋子都像开了一树桂花。

书读了一半，趴在旁边睡着了。醒来时茶已经凉了，阳光从桌子的左边挪到了右边。

不着急，反正书不会跑。`,
    images: [teaArt],
    mood: "🍵",
    weather: "晴 24°",
    location: "厨房",
    tags: ["茶", "阅读", "秋天"],
    createdAt: "2026-09-28T16:20:00+08:00",
    updatedAt: null,
    pinned: false,
    likes: 6,
  },
  {
    id: "2026-09-12-night-train",
    title: "夜车经过很多座桥",
    content: `从南边回来，坐了一班很慢的夜车。

车厢里只坐了一半的人。有人抱着花，有人抱着电脑，有人像我一样，抱着一个没必要的清醒。

过了很多座桥。每过一座，窗外的灯就在脸上亮一下，又暗下去。

凌晨一点，列车员推着小车经过，我买了一瓶水。她说：“还有两个小时，睡一会儿吧。”

我点点头，却一直看着窗外。`,
    images: [],
    mood: "🌙",
    weather: "夜风 14°",
    location: "夜行列车",
    tags: ["旅行", "夜"],
    createdAt: "2026-09-12T23:50:00+08:00",
    updatedAt: null,
    pinned: false,
    likes: 11,
  },
  {
    id: "2026-08-30-hello",
    title: "把这里打扫干净了",
    content: `这是我的新角落，用来放一些不值得发朋友圈、又舍不得丢掉的小事。

会写今天吃了什么，也会写突然想起的人；会放拍坏的照片，也会放认真画了很久的画。

如果你恰好路过，欢迎坐一会儿。

- [x] 换一张新的头像
- [x] 给窗台添一盆植物
- [ ] 学会好好记录`,
    images: [],
    mood: "🔥",
    weather: "晴 28°",
    location: "这里",
    tags: ["公告", "开始"],
    createdAt: "2026-08-30T10:10:00+08:00",
    updatedAt: null,
    pinned: false,
    likes: 3,
  },
];

export function createSeedPosts(): Post[] {
  return seedPosts.map((post) => ({
    ...post,
    theme: post.images[0]
      ? themeFromPalette(post.images[0].palette)
      : DEFAULT_THEME,
  }));
}
