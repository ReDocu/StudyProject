window.FixedSubjects = {
  필기: [
    "소프트웨어 설계",
    "소프트웨어 개발",
    "데이터베이스 구축",
    "프로그래밍 언어 활용",
    "정보 시스템 구축 관리"
  ],
  실기: [
    "요구사항 확인",
    "데이터 입출력 구현",
    "통합 구현",
    "서버 프로그램 구현",
    "인터페이스 구현",
    "화면 설계",
    "애플리케이션 테스트 관리",
    "SQL 응용",
    "소프트웨어 개발 보안 구축",
    "프로그래밍 언어 활용",
    "응용 SW 기초 기술 활용",
    "제품 소프트웨어 패키징"
  ]
};

window.FixedProblemCategories = {
  sql: ["DDL", "DCL", "DML"],
  coding: ["Python", "C", "JAVA"]
};

window.SeedData = {
  settings: {
    theme: "light",
    accentColor: "#5CFFD1"
  },
  updates: [
    { date: "2026-03-28", title: "초기 구조 생성", content: "대시보드, 학습, 문제 풀이, 관리자 페이지 기본 기능이 준비되었습니다." },
    { date: "2026-03-28", title: "JSON/CSV 입출력", content: "설정 페이지와 전체 데이터 페이지에서 저장 및 불러오기를 지원합니다." },
    { date: "2026-03-28", title: "학습 진행 업데이트", content: "필기/실기 페이지에서 학습 완료 후 다음 콘텐츠로 이동할 수 있습니다." }
  ],
  progress: {
    completedStudyKeys: []
  },
  written: {
    필기: [
      {
        id: crypto.randomUUID(),
        subject: "소프트웨어 설계",
        topics: [
          {
            name: "개발 방법론",
            subtopics: [
              {
                name: "폭포수 모형",
                content: "요구사항 분석 → 설계 → 구현 → 테스트 → 유지보수 순서로 진행되는 전통적 개발 모델이다.",
                keywords: [
                  { word: "순차적", description: "이전 단계가 끝나야 다음 단계로 진행한다." },
                  { word: "문서화", description: "단계별 산출물이 명확하다." }
                ]
              },
              {
                name: "애자일",
                content: "변화 대응과 협업을 중시하며 짧은 반복 개발을 수행한다.",
                keywords: [
                  { word: "스프린트", description: "짧은 개발 주기 단위다." },
                  { word: "회고", description: "주기 종료 후 개선점을 도출한다." }
                ]
              }
            ]
          }
        ]
      },
      { id: crypto.randomUUID(), subject: "소프트웨어 개발", topics: [] },
      {
        id: crypto.randomUUID(),
        subject: "데이터베이스 구축",
        topics: [
          {
            name: "정규화",
            subtopics: [
              {
                name: "제1정규형",
                content: "도메인이 원자값만 가지도록 구성한다.",
                keywords: [
                  { word: "원자값", description: "컬럼에는 더 이상 분해되지 않는 값만 들어간다." }
                ]
              }
            ]
          }
        ]
      },
      { id: crypto.randomUUID(), subject: "프로그래밍 언어 활용", topics: [] },
      { id: crypto.randomUUID(), subject: "정보 시스템 구축 관리", topics: [] }
    ],
    실기: [
      {
        id: crypto.randomUUID(),
        subject: "요구사항 확인",
        topics: [
          {
            name: "현행 시스템 분석",
            subtopics: [
              {
                name: "분석 절차",
                content: "운영체제, 네트워크, DBMS, 미들웨어 등 현재 시스템 환경을 파악한다.",
                keywords: [
                  { word: "현행 시스템", description: "개발 대상이 배치될 기존 운영 환경" }
                ]
              }
            ]
          }
        ]
      },
      { id: crypto.randomUUID(), subject: "데이터 입출력 구현", topics: [] },
      { id: crypto.randomUUID(), subject: "통합 구현", topics: [] },
      { id: crypto.randomUUID(), subject: "서버 프로그램 구현", topics: [] },
      { id: crypto.randomUUID(), subject: "인터페이스 구현", topics: [] },
      {
        id: crypto.randomUUID(),
        subject: "화면 설계",
        topics: [
          {
            name: "UI 설계 원칙",
            subtopics: [
              {
                name: "직관성",
                content: "사용자가 별도 학습 없이 쉽게 이해할 수 있어야 한다.",
                keywords: [
                  { word: "가시성", description: "정보가 명확히 보이도록 설계한다." }
                ]
              }
            ]
          }
        ]
      },
      { id: crypto.randomUUID(), subject: "애플리케이션 테스트 관리", topics: [] },
      { id: crypto.randomUUID(), subject: "SQL 응용", topics: [] },
      { id: crypto.randomUUID(), subject: "소프트웨어 개발 보안 구축", topics: [] },
      { id: crypto.randomUUID(), subject: "프로그래밍 언어 활용", topics: [] },
      { id: crypto.randomUUID(), subject: "응용 SW 기초 기술 활용", topics: [] },
      { id: crypto.randomUUID(), subject: "제품 소프트웨어 패키징", topics: [] }
    ]
  },
  problems: {
    sql: [
      {
        id: crypto.randomUUID(),
        category: "DML",
        purpose: "조건에 맞는 데이터 조회",
        code: "SELECT name FROM users WHERE age >= 20;",
        answer: "20세 이상 사용자 이름 조회",
        explanation: "WHERE 절로 조건을 지정하고 SELECT로 필요한 컬럼만 가져온다."
      },
      {
        id: crypto.randomUUID(),
        category: "DDL",
        purpose: "테이블 생성",
        code: "CREATE TABLE member (id INT PRIMARY KEY, name VARCHAR(50));",
        answer: "member 테이블 생성",
        explanation: "기본키와 컬럼 타입을 정의하여 새 테이블을 생성한다."
      }
    ],
    coding: [
      {
        id: crypto.randomUUID(),
        category: "JAVA",
        purpose: "반복문 이해",
        code: "for (int i = 0; i < 3; i++) { System.out.println(i); }",
        answer: "0, 1, 2 출력",
        explanation: "초기식, 조건식, 증감식에 따라 0부터 2까지 반복 출력한다."
      },
      {
        id: crypto.randomUUID(),
        category: "Python",
        purpose: "리스트 합계 계산",
        code: "nums = [1,2,3]\nprint(sum(nums))",
        answer: "6",
        explanation: "sum 함수는 iterable의 값을 누적한다."
      }
    ],
    bank: [
      {
        id: crypto.randomUUID(),
        type: "필기",
        question: "애자일 방법론의 특징 2가지를 쓰시오.",
        answer: "반복 개발, 변화 대응",
        explanation: "짧은 주기와 지속적인 피드백 반영이 핵심이다."
      },
      {
        id: crypto.randomUUID(),
        type: "SQL",
        question: "DML에 해당하는 명령어를 하나 쓰시오.",
        answer: "SELECT 또는 INSERT",
        explanation: "DML은 데이터 조작 언어다."
      }
    ]
  },
  records: [
    {
      id: crypto.randomUUID(),
      date: "2026-03-28",
      subject: "소프트웨어 설계",
      category: "필기",
      memo: "애자일과 폭포수 차이 비교",
      minutes: 45
    },
    {
      id: crypto.randomUUID(),
      date: "2026-03-27",
      subject: "SQL",
      category: "SQL",
      memo: "DML 문제 3개 풀이",
      minutes: 35
    }
  ]
};
