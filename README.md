# D³ Lab Website

**D³ Lab — Data · Dynamics · Discovery**, Graduate School of Data Science, Seoul National University

빌드 도구 없이 동작하는 순수 HTML/CSS/JS 사이트입니다.
`index.html`을 더블클릭하면 브라우저에서 바로 확인할 수 있습니다.

## 내용 수정하기

| 무엇을 | 어디서 |
|---|---|
| 연구실 이름, 메뉴 순서, 연락처(이메일·연구실 위치·주소, 푸터에 표시), 논문에서 굵게 표시할 이름 | `data/site.js` |
| 구성원 (role: `pi`, `postdoc`, `phd`, `ms`, `intern`, `alumni`) | `data/members.js` |
| 논문 (새 논문은 파일 **맨 위**에 추가) | `data/publications.js` |
| 소식 (날짜순 자동 정렬) | `data/news.js` |
| 첫 화면 문구, 모집 안내, What we do | `index.html` |
| 연구 방향 설명 | `research.html` |
| 지원 안내 (Google Docs 링크) | `join.html` |
| 강의 | `teaching.html` |

- 논문의 `direction` 값(`"systems"`, `"efficiency"`, `"aix"`)을 정하면 Research 페이지의 해당 연구 방향 아래에 표시됩니다.
- 사진은 `assets/img/people/`에 넣고 `members.js`의 `photo`에 경로를 적습니다.
- 모집이 끝나면 `index.html`의 `<section class="block hiring-block">` 블록을 지웁니다.

## 구조

```
*.html                 페이지 7개
assets/css/style.css   디자인 (색상은 맨 위 :root 변수, 다크 모드 색은 바로 아래)
assets/js/main.js      헤더/푸터, 라이트·다크 전환, 데이터 렌더링,
                       첫 화면 애니메이션(heroAnimation), Research 애니메이션(directionAnimation)
data/*.js              콘텐츠
```

## 배포

GitHub Organization `snu-dcube`의 `snu-dcube.github.io` 저장소에 push하면
GitHub Pages로 자동 공개됩니다. (커스텀 도메인 예정: `dcube.snu.ac.kr`)
