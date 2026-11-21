/* ==========================================================================
   奶油镇·出门去 —— 道具和目的地设定（改文字只改这个文件）
   文字都是 [中文, 한국어]
   ========================================================================== */
const TRIP = {
  title: ['奶油镇 · 出门去', '크림 마을 · 다녀올게'],

  /* 便当：决定旅行时间（单位：分钟；「演示模式」下 1 分钟 = 1 秒） */
  foods: [
    { id: 'cookie',   icon: '🍪', price: 5,  min: 20,  max: 45,  name: ['奶油小饼干', '크림 쿠키'],   desc: ['近一点，很快回来', '가까운 곳, 금방 돌아와'] },
    { id: 'sandwich', icon: '🥪', price: 12, min: 45,  max: 100, name: ['三叶草三明治', '클로버 샌드위치'], desc: ['走得远一点', '조금 더 멀리'] },
    { id: 'bento',    icon: '🍱', price: 25, min: 100, max: 200, name: ['云朵便当', '구름 도시락'],     desc: ['一场长长的旅行', '긴긴 여행'] }
  ],

  /* 道具：影响去哪里（tag 匹配的目的地更容易被选中） */
  tools: [
    { id: 'map',     icon: '🗺️', price: 15, tag: 'far',   name: ['旧地图', '낡은 지도'],      desc: ['想去远方', '먼 곳에 가고 싶어'] },
    { id: 'lantern', icon: '🏮', price: 10, tag: 'night', name: ['小提灯', '작은 등불'],      desc: ['夜里也不怕', '밤에도 무섭지 않아'] },
    { id: 'mat',     icon: '🧺', price: 8,  tag: 'out',   name: ['野餐垫', '피크닉 매트'],    desc: ['去户外晒太阳', '밖에서 햇볕 쬐기'] },
    { id: 'letter',  icon: '💌', price: 20, tag: 'friend', name: ['邀请信', '초대 편지'],      desc: ['一定会寄明信片，还会去朋友家', '엽서를 꼭 보내고, 친구 집에 가'] }
  ],

  /* 目的地：owner = 住在那里的居民（明信片上会一起出现） */
  places: [
    { id: 'shuwu',    owner: 'naitu',           tags: ['near', 'night', 'in', 'friend'], scene: 'room',   name: ['奶油小书屋', '크림 서재'],        act: ['一起喝着热可可，听深夜的故事', '핫코코아를 마시며 밤 이야기를 들었어'],      gift: { icon: '☕', name: ['热可可茶包', '핫코코아 티백'] } },
    { id: 'piaochuang', owner: 'naimao',        tags: ['near', 'day', 'in', 'friend'],   scene: 'window', name: ['飘窗侦探角', '창가 탐정 코너'],    act: ['用放大镜找到了三根猫毛（嘘）', '돋보기로 고양이털 세 가닥을 찾았어 (쉿)'],   gift: { icon: '🔍', name: ['迷你放大镜', '미니 돋보기'] } },
    { id: 'shijian',  owner: 'naiqi',           tags: ['near', 'day', 'in', 'friend'],   scene: 'clock',  name: ['时间管理室', '시간 관리실'],      act: ['被排进了日程表：15:00 下午茶', '일정표에 들어갔어: 15:00 티타임'],        gift: { icon: '⏱️', name: ['旧怀表', '낡은 회중시계'] } },
    { id: 'lutai',    owner: 'naihaibao',       tags: ['near', 'day', 'out', 'friend'],  scene: 'lake',   name: ['湖边小露台', '호숫가 테라스'],    act: ['捧着云朵热饮，一起发了一下午呆', '구름 음료를 들고 오후 내내 멍때렸어'],     gift: { icon: '☁️', name: ['云朵棉花糖', '구름 마시멜로'] } },
    { id: 'gongfang', owner: 'naihu',           tags: ['far', 'day', 'out', 'friend'],   scene: 'tree',   name: ['树顶创意工坊', '나무 위 공방'],    act: ['帮忙做了会发光的灯泡墙', '반짝이는 전구 벽 만들기를 도왔어'],         gift: { icon: '💡', name: ['发光小灯泡', '반짝 전구'] } },
    { id: 'cangku',   owner: 'naicang',         tags: ['near', 'night', 'in', 'friend'], scene: 'cellar', name: ['地下储藏仓', '지하 저장고'],      act: ['数了 47 颗橡果，还登记了借条', '도토리 47개를 세고 대여 장부도 적었어'],    gift: { icon: '🌰', name: ['第 48 号橡果', '48번 도토리'] } },
    { id: 'shiwu',    owner: 'naixiong',        tags: ['far', 'night', 'out', 'friend'], scene: 'forest', name: ['森林小石屋', '숲속 돌집'],        act: ['在火炉边被拍了拍肩膀', '난롯가에서 어깨를 토닥여 줬어'],            gift: { icon: '🪵', name: ['小木头徽章', '나무 배지'] } },
    { id: 'gelou',    owner: 'naixiaoxiongmao', tags: ['far', 'day', 'in', 'friend'],    scene: 'attic',  name: ['林间观景阁楼', '숲속 전망 다락방'], act: ['被写进了小故事本的第一页', '이야기 노트 첫 페이지에 적혔어'],          gift: { icon: '📒', name: ['迷你故事本', '미니 이야기 노트'] } },
    { id: 'island',   owner: null,              tags: ['far', 'day', 'out'],             scene: 'island', name: ['浮空岛', '떠 있는 섬'],          act: ['爬上了云上的小岛，风好大', '구름 위 작은 섬에 올랐어, 바람이 세!'],      gift: { icon: '🪶', name: ['云上的羽毛', '구름 위 깃털'] } },
    { id: 'zhonglou', owner: null,              tags: ['near', 'night', 'out'],          scene: 'night',  name: ['小镇钟楼', '마을 종탑'],          act: ['黎明前敲响了温柔的小钟', '새벽이 오기 전 작은 종을 울렸어'],         gift: { icon: '🔔', name: ['小铜铃', '작은 구리 방울'] } },
    { id: 'sea',      owner: null,              tags: ['far', 'day', 'out'],             scene: 'sea',    name: ['奶油海边', '크림 바닷가'],        act: ['捡到了一个会唱歌的贝壳', '노래하는 조개를 주웠어'],               gift: { icon: '🐚', name: ['会唱歌的贝壳', '노래하는 조개'] } },
    { id: 'garden',   owner: null,              tags: ['near', 'day', 'out'],            scene: 'garden', name: ['三叶草花田', '클로버 꽃밭'],      act: ['找到了一片四叶草！', '네잎클로버를 찾았어!'],                     gift: { icon: '🍀', name: ['四叶草书签', '네잎클로버 책갈피'] } }
  ],

  /* 在家里做的事（随机换） */
  home: [
    { face: 'happy', text: ['在看书', '책 읽는 중'] },
    { face: 'love',  text: ['在写信', '편지 쓰는 중'] },
    { face: 'sleep', text: ['在午睡', '낮잠 자는 중'] },
    { face: 'proud', text: ['在整理背包', '가방 정리 중'] },
    { face: 'happy', text: ['在发呆', '멍때리는 중'] }
  ],

  lines: {
    back:   [['我回来啦！', '다녀왔어!'], ['带了礼物回来哦', '선물 가져왔어'], ['外面好好玩～', '밖은 정말 재밌었어~'], ['还是家里最舒服', '역시 집이 제일 편해']],
    leave:  [['我出门啦，不用等我', '다녀올게, 기다리지 마'], ['行李收好了，出发！', '짐 다 챙겼어, 출발!']],
    packed: [['谢谢你准备的行李', '짐 챙겨 줘서 고마워'], ['嗯……什么时候出发呢', '음… 언제 떠날까'], ['想去哪里好呢', '어디로 가 볼까']],
    hungry: [['没有便当，今天就待在家吧', '도시락이 없으니 오늘은 집에 있을래'], ['去院子收点三叶草吧', '마당에서 클로버를 모아 봐']],
    away:   [['房间空空的……', '방이 텅 비었어…'], ['TA 去旅行了，信箱会有惊喜', '여행 중이야, 우편함을 기다려 봐']]
  }
};
