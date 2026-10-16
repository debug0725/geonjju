// ───────────────────────────────────────────────
//  단칸방 설정 — 이름·색·채널 설명은 여기서만 고치면 됩니다.
// ───────────────────────────────────────────────
window.ROOM = {
  // 왼쪽 위 서버 이름과 브라우저 탭 제목
  serverName: '건호 · 주훈',
  siteTitle: '단칸방',

  // 멤버: 이름은 DB와 같아야 해요. color는 이름·아바타 색, role은 멤버 목록에 표시되는 역할 이름
  members: [
    {name: '건호', color: '#8ea1ff', role: '멤버'},
    {name: '주훈', color: '#d6a4f5', role: '멤버'},
  ],

  // 텍스트 채널: 키(diary, music)는 api/index.js의 CHANNEL_KINDS와 같아야 해요.
  // topic은 채널 이름 옆에 보이는 설명, welcome은 채널 맨 위 환영 문구예요.
  // locked: true 는 비밀번호를 풀어야 보이는 채널 (api/index.js의 LOCKED_CHANNELS와 같게)
  channels: [
    {key: 'diary', label: '일기', locked: true, topic: '오늘 있었던 일', welcome: '하루하루 남기는 우리 둘의 일기장이에요.'},
    {key: 'music', label: '음악', topic: '같이 듣고 싶은 노래 · 유튜브 링크를 붙이면 바로 재생돼요', welcome: '좋은 노래를 발견하면 여기에 남겨 주세요.'},
  ],

  // 공개 방명록
  guestbook: {label: '방명록', topic: '누구나 글을 남길 수 있어요', welcome: '들러 주셔서 고마워요. 한마디 남겨 주세요!'},

  // 음성 채널(연출용 — 실제 통화는 없어요)
  voice: {label: '라운지'},

  // 반응·이모지 버튼에 보이는 이모지
  emojis: ['❤️', '😂', '🥹', '👍', '🔥', '😭', '🙏', '👀', '🎉', '✨', '😳', '🤔', '💯', '🎵', '🍜', '🌙'],
};
