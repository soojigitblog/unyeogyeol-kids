// P3.5 "재능을 키우는 실제 행동" — AI가 아니라 직접 큐레이션한 정적 데이터.
// 놀이/질문/활동은 매번 다르게 지어낼 이유가 없는 참고 콘텐츠라 결정론으로 관리한다.
// 서비스 대상 연령(2~8세)의 핵심 3개 밴드(toddler/preschool/kindergarten)만 실제
// 콘텐츠를 채우고, 그 밖의 밴드는 정직한 일반 기본값으로 처리한다.

import type { AgeBand } from "@/lib/age";
import type { TalentId } from "./talentSeedCategories";

export interface GrowthActionSet {
  recommendedPlay: string[];
  parentQuestions: string[];
  experienceActivities: string[];
  avoidParentingPattern: string;
  nextAgeExtension: string;
  groundedInGeneric: boolean;
}

type CoreBand = "toddler" | "preschool" | "kindergarten";

const CORE_BANDS: CoreBand[] = ["toddler", "preschool", "kindergarten"];

const CURATED: Record<TalentId, Record<CoreBand, Omit<GrowthActionSet, "groundedInGeneric">>> = {
  talent_observation: {
    toddler: {
      recommendedPlay: ["숨은 그림 찾기", "다른 그림 찾기", "색깔 분류 놀이"],
      parentQuestions: ["뭐가 달라졌어?", "어디에서 찾았어?"],
      experienceActivities: ["산책하며 나뭇잎 관찰", "곤충 관찰"],
      avoidParentingPattern: "정답을 먼저 알려주기보다 발견할 시간을 주세요.",
      nextAgeExtension: "관찰일기로 발견한 것을 그림으로 남겨보세요.",
    },
    preschool: {
      recommendedPlay: ["관찰일기 그리기", "미니 탐정 놀이", "퍼즐"],
      parentQuestions: ["뭐가 신기했어?", "전에랑 뭐가 바뀐 것 같아?"],
      experienceActivities: ["식물 키우며 변화 기록", "박물관 체험"],
      avoidParentingPattern: "빠른 정답을 재촉하지 마세요.",
      nextAgeExtension: "간단한 과학 실험으로 확장해보세요.",
    },
    kindergarten: {
      recommendedPlay: ["과학 실험 키트", "관찰 기반 그림일기"],
      parentQuestions: ["네가 발견한 걸 나한테 알려줄래?", "왜 그렇게 생각했어?"],
      experienceActivities: ["생물 관찰 활동", "과학관 체험"],
      avoidParentingPattern: "결과보다 관찰 과정을 칭찬해주세요.",
      nextAgeExtension: "관찰 결과를 스스로 기록하는 습관으로 이어가 보세요.",
    },
  },
  talent_inquiry: {
    toddler: {
      recommendedPlay: ["새로운 장난감 탐색", "촉감놀이"],
      parentQuestions: ["이건 뭘까?", "만지면 어떤 느낌이야?"],
      experienceActivities: ["새로운 장소 방문", "동물원/수족관 나들이"],
      avoidParentingPattern: "위험하지 않다면 새로운 시도를 막지 마세요.",
      nextAgeExtension: "궁금한 것을 직접 찾아보게 안내해보세요.",
    },
    preschool: {
      recommendedPlay: ["실험 놀이", "왜?퀴즈 놀이"],
      parentQuestions: ["왜 그럴까?", "다르게 해보면 어떻게 될까?"],
      experienceActivities: ["체험형 전시 관람", "요리 실험"],
      avoidParentingPattern: "질문에 즉답만 주지 말고 함께 생각해보세요.",
      nextAgeExtension: "직접 가설을 세우고 확인해보는 활동으로 확장하세요.",
    },
    kindergarten: {
      recommendedPlay: ["탐구 프로젝트", "간단한 코딩 놀이"],
      parentQuestions: ["더 알아보고 싶은 게 있어?", "어떻게 확인해볼까?"],
      experienceActivities: ["도서관에서 궁금증 조사", "간단한 실험 프로젝트"],
      avoidParentingPattern: "정해진 답만 요구하지 마세요.",
      nextAgeExtension: "스스로 주제를 정해 짧은 탐구를 이어가게 해보세요.",
    },
  },
  talent_logic: {
    toddler: {
      recommendedPlay: ["블록 순서 맞추기", "크기별 정리 놀이"],
      parentQuestions: ["뭐가 먼저일까?", "어떤 게 더 클까?"],
      experienceActivities: ["숫자 세기 놀이"],
      avoidParentingPattern: "복잡한 설명보다 짧고 순차적으로 안내하세요.",
      nextAgeExtension: "간단한 규칙 게임으로 확장해보세요.",
    },
    preschool: {
      recommendedPlay: ["보드게임", "패턴 맞추기"],
      parentQuestions: ["왜 그렇게 순서를 정했어?", "다음엔 뭐가 올까?"],
      experienceActivities: ["간단한 보드게임 대회"],
      avoidParentingPattern: "결과만 보지 말고 생각한 과정을 물어봐 주세요.",
      nextAgeExtension: "규칙을 직접 만들어보는 놀이로 확장하세요.",
    },
    kindergarten: {
      recommendedPlay: ["전략 보드게임", "퍼즐/큐브"],
      parentQuestions: ["어떤 순서로 풀었어?", "다른 방법도 있을까?"],
      experienceActivities: ["체스/장기 입문", "간단한 코딩 블록"],
      avoidParentingPattern: "빠른 정답보다 풀이 과정을 존중해주세요.",
      nextAgeExtension: "여러 단계를 거치는 프로젝트형 활동으로 넓혀보세요.",
    },
  },
  talent_language: {
    toddler: {
      recommendedPlay: ["그림책 읽기", "말놀이"],
      parentQuestions: ["이 다음엔 어떻게 될까?", "이 친구는 뭐라고 말할까?"],
      experienceActivities: ["동화 구연 듣기"],
      avoidParentingPattern: "발음 교정을 자주 끊지 말고 끝까지 들어주세요.",
      nextAgeExtension: "짧은 이야기를 직접 지어보게 해보세요.",
    },
    preschool: {
      recommendedPlay: ["이야기 지어내기", "끝말잇기"],
      parentQuestions: ["다음엔 무슨 일이 생길까?", "주인공 기분이 어땠을까?"],
      experienceActivities: ["도서관 나들이", "인형극 관람"],
      avoidParentingPattern: "문법을 지적하기보다 이야기 내용에 반응해주세요.",
      nextAgeExtension: "직접 만든 이야기를 그림책처럼 만들어보세요.",
    },
    kindergarten: {
      recommendedPlay: ["짧은 글쓰기", "역할극 대본 만들기"],
      parentQuestions: ["이 이야기 제목은 뭐라고 지을까?", "다르게 표현하면 어떨까?"],
      experienceActivities: ["글쓰기 워크숍", "연극 체험"],
      avoidParentingPattern: "맞춤법보다 표현하고 싶은 내용을 먼저 들어주세요.",
      nextAgeExtension: "친구들과 함께하는 이야기 만들기로 확장하세요.",
    },
  },
  talent_expression: {
    toddler: {
      recommendedPlay: ["역할놀이", "노래·율동"],
      parentQuestions: ["지금 기분이 어때?", "어떤 표정을 지어볼까?"],
      experienceActivities: ["동요 부르기", "간단한 율동"],
      avoidParentingPattern: "감정 표현을 참으라고 하지 마세요.",
      nextAgeExtension: "짧은 발표나 무대 경험으로 확장해보세요.",
    },
    preschool: {
      recommendedPlay: ["역할극", "인형극 만들기"],
      parentQuestions: ["이걸 어떻게 보여줄까?", "다른 방식으로도 표현해볼까?"],
      experienceActivities: ["무대 발표 경험", "미술로 감정 표현하기"],
      avoidParentingPattern: "표현이 과하다고 자주 제지하지 마세요.",
      nextAgeExtension: "작은 발표회나 공연 경험을 만들어주세요.",
    },
    kindergarten: {
      recommendedPlay: ["연극/뮤지컬 놀이", "발표 연습"],
      parentQuestions: ["이 감정을 몸으로 어떻게 표현할까?", "관객에게 어떻게 전달하고 싶어?"],
      experienceActivities: ["연극 캠프", "학예회 준비"],
      avoidParentingPattern: "완성도보다 표현하려는 시도를 먼저 인정해주세요.",
      nextAgeExtension: "정기적인 발표/공연 기회를 이어가 보세요.",
    },
  },
  talent_creativity: {
    toddler: {
      recommendedPlay: ["자유 그림 그리기", "블록으로 새로운 것 만들기"],
      parentQuestions: ["이건 뭘 만든 거야?", "또 뭘 만들어볼까?"],
      experienceActivities: ["자유 미술 활동"],
      avoidParentingPattern: "정해진 모양대로 만들라고 하지 마세요.",
      nextAgeExtension: "여러 재료를 섞어보는 만들기로 확장하세요.",
    },
    preschool: {
      recommendedPlay: ["만들기 놀이", "이야기 상상하기"],
      parentQuestions: ["다르게 만들면 어떨까?", "이걸로 또 뭘 할 수 있을까?"],
      experienceActivities: ["창작 미술 클래스", "업사이클링 만들기"],
      avoidParentingPattern: "'원래 이렇게 하는 거야'라고 정답을 정하지 마세요.",
      nextAgeExtension: "직접 재료를 골라 자유 작품을 만들어보게 하세요.",
    },
    kindergarten: {
      recommendedPlay: ["창작 프로젝트", "발명 놀이"],
      parentQuestions: ["이 아이디어는 어떻게 떠올랐어?", "더 새롭게 바꿔볼 부분이 있을까?"],
      experienceActivities: ["메이커 체험", "미술관 창작 프로그램"],
      avoidParentingPattern: "기존 방식과 다르다고 바로 고치려 하지 마세요.",
      nextAgeExtension: "아이디어를 실제로 만들어보는 프로젝트로 이어가세요.",
    },
  },
  talent_spatial: {
    toddler: {
      recommendedPlay: ["블록 쌓기", "퍼즐 맞추기"],
      parentQuestions: ["어디에 놓으면 딱 맞을까?", "이건 어느 쪽으로 돌리면 될까?"],
      experienceActivities: ["큰 블록 조립"],
      avoidParentingPattern: "완성 모양을 먼저 알려주지 말고 시도하게 두세요.",
      nextAgeExtension: "더 복잡한 조립 놀이로 확장하세요.",
    },
    preschool: {
      recommendedPlay: ["레고 조립", "미로 찾기"],
      parentQuestions: ["이 길로 가면 어디로 이어질까?", "다르게 조립하면 어떻게 될까?"],
      experienceActivities: ["미니어처 조립", "블록 대회"],
      avoidParentingPattern: "설명서대로만 만들라고 강요하지 마세요.",
      nextAgeExtension: "설계도를 스스로 그려보는 활동으로 넓혀보세요.",
    },
    kindergarten: {
      recommendedPlay: ["로봇 조립 키트", "3D 퍼즐"],
      parentQuestions: ["구조를 어떻게 설계했어?", "더 튼튼하게 만들려면 어떻게 할까?"],
      experienceActivities: ["메이커 스페이스 체험", "간단한 건축 모형 만들기"],
      avoidParentingPattern: "실패한 구조를 바로 고쳐주지 말고 다시 시도하게 두세요.",
      nextAgeExtension: "직접 설계부터 조립까지 이어지는 프로젝트로 확장하세요.",
    },
  },
  talent_physical: {
    toddler: {
      recommendedPlay: ["신체 놀이터", "공놀이"],
      parentQuestions: ["몸을 어떻게 움직이니까 재밌어?", "더 빠르게/천천히 해볼까?"],
      experienceActivities: ["실외 놀이터 방문"],
      avoidParentingPattern: "가만히 있으라고 자주 제지하지 마세요.",
      nextAgeExtension: "간단한 규칙이 있는 신체 놀이로 확장하세요.",
    },
    preschool: {
      recommendedPlay: ["줄넘기", "간단한 스포츠 놀이"],
      parentQuestions: ["오늘은 뭐가 제일 재밌었어?", "다음엔 뭘 도전해볼까?"],
      experienceActivities: ["수영/체조 체험"],
      avoidParentingPattern: "잘하는 아이와 비교하지 마세요.",
      nextAgeExtension: "정기적인 운동 활동으로 이어가 보세요.",
    },
    kindergarten: {
      recommendedPlay: ["팀 스포츠 놀이", "자전거 타기"],
      parentQuestions: ["몸으로 표현하니 어떤 게 좋았어?", "다음 목표는 뭐야?"],
      experienceActivities: ["스포츠 클럽 체험"],
      avoidParentingPattern: "성적/순위만 강조하지 마세요.",
      nextAgeExtension: "본인이 좋아하는 종목을 꾸준히 이어가게 해주세요.",
    },
  },
  talent_empathy: {
    toddler: {
      recommendedPlay: ["인형 돌봐주기 놀이", "감정 카드 놀이"],
      parentQuestions: ["이 친구는 기분이 어때 보여?", "너라면 어떻게 도와줄래?"],
      experienceActivities: ["동물 돌봄 체험"],
      avoidParentingPattern: "감정을 대신 정의해주지 말고 물어봐 주세요.",
      nextAgeExtension: "또래와 함께하는 돌봄 놀이로 확장하세요.",
    },
    preschool: {
      recommendedPlay: ["역할극(도와주기)", "감정 이야기책"],
      parentQuestions: ["친구가 속상해 보이면 어떻게 해줄까?", "네 마음은 어때?"],
      experienceActivities: ["봉사/나눔 체험(연령에 맞게)"],
      avoidParentingPattern: "감정을 억누르라고 하지 마세요.",
      nextAgeExtension: "친구 관계 안에서 도움을 주는 역할을 맡겨보세요.",
    },
    kindergarten: {
      recommendedPlay: ["또래 상담 역할극", "동물/식물 돌봄"],
      parentQuestions: ["그 친구 입장이라면 어땠을까?", "어떻게 하면 더 편해질까?"],
      experienceActivities: ["나눔 활동", "반려동물 돌봄 경험"],
      avoidParentingPattern: "타인의 감정까지 책임지게 만들지 마세요.",
      nextAgeExtension: "또래 관계에서 중재자 역할을 자연스럽게 맡겨보세요.",
    },
  },
  talent_relationship: {
    toddler: {
      recommendedPlay: ["또래와 짧은 놀이 시간", "인사 놀이"],
      parentQuestions: ["오늘 누구랑 놀았어?", "같이 놀아서 어땠어?"],
      experienceActivities: ["또래 모임 짧게 참여"],
      avoidParentingPattern: "억지로 오래 어울리게 강요하지 마세요.",
      nextAgeExtension: "소규모 그룹 놀이 시간을 조금씩 늘려보세요.",
    },
    preschool: {
      recommendedPlay: ["그룹 놀이", "협동 게임"],
      parentQuestions: ["같이 하니까 뭐가 좋았어?", "다음엔 누구랑 놀고 싶어?"],
      experienceActivities: ["그룹 활동 수업"],
      avoidParentingPattern: "친구 수로 사회성을 평가하지 마세요.",
      nextAgeExtension: "역할을 나누는 협동 놀이로 확장하세요.",
    },
    kindergarten: {
      recommendedPlay: ["팀 프로젝트 놀이", "보드게임(다인)"],
      parentQuestions: ["팀에서 네 역할은 뭐였어?", "의견이 다를 땐 어떻게 했어?"],
      experienceActivities: ["동아리형 그룹 활동"],
      avoidParentingPattern: "갈등을 부모가 먼저 대신 해결해주지 마세요.",
      nextAgeExtension: "작은 갈등을 스스로 조율해보는 경험을 늘려보세요.",
    },
  },
  talent_leadership: {
    toddler: {
      recommendedPlay: ["놀이 이끌기(간단한 규칙 정하기)"],
      parentQuestions: ["오늘은 뭐 하고 놀지 네가 정해볼래?", "어떤 순서로 할까?"],
      experienceActivities: ["역할을 맡는 소꿉놀이"],
      avoidParentingPattern: "매번 부모가 놀이를 주도하지 마세요.",
      nextAgeExtension: "친구들과의 놀이에서 규칙을 함께 정해보게 하세요.",
    },
    preschool: {
      recommendedPlay: ["역할 나누는 놀이", "간단한 팀 게임"],
      parentQuestions: ["다 같이 하려면 어떻게 정하면 좋을까?", "친구들 의견은 어땠어?"],
      experienceActivities: ["그룹 활동에서 역할 맡기"],
      avoidParentingPattern: "혼자 다 정하려 하면 다른 친구 의견도 들어보게 안내하세요.",
      nextAgeExtension: "작은 모둠을 이끄는 역할을 조금씩 맡겨보세요.",
    },
    kindergarten: {
      recommendedPlay: ["팀 프로젝트 리더 역할", "발표 진행자 역할"],
      parentQuestions: ["팀을 어떻게 이끌었어?", "의견이 갈릴 땐 어떻게 정했어?"],
      experienceActivities: ["학급 활동에서 역할 맡기"],
      avoidParentingPattern: "결과만 보고 평가하지 말고 이끄는 과정을 물어봐 주세요.",
      nextAgeExtension: "정기적으로 작은 그룹을 이끄는 기회를 만들어주세요.",
    },
  },
  talent_independence: {
    toddler: {
      recommendedPlay: ["혼자 옷 골라 입기", "간단한 자기 결정 놀이"],
      parentQuestions: ["오늘은 뭘 입고 싶어?", "이거랑 저거 중에 뭐가 좋아?"],
      experienceActivities: ["스스로 정리하기 연습"],
      avoidParentingPattern: "매번 부모가 대신 결정해주지 마세요.",
      nextAgeExtension: "선택할 수 있는 범위를 조금씩 넓혀주세요.",
    },
    preschool: {
      recommendedPlay: ["혼자 하는 미션 놀이", "스스로 계획 세우기"],
      parentQuestions: ["오늘 계획은 뭐야?", "어떻게 하고 싶어?"],
      experienceActivities: ["작은 심부름 맡기기"],
      avoidParentingPattern: "실수하기 전에 미리 다 알려주지 마세요.",
      nextAgeExtension: "혼자 해내는 작은 프로젝트를 맡겨보세요.",
    },
    kindergarten: {
      recommendedPlay: ["스스로 계획하고 실행하는 활동"],
      parentQuestions: ["이번엔 어떻게 해보고 싶어?", "혼자 해보니 어땠어?"],
      experienceActivities: ["짧은 여행/외출 계획에 참여시키기"],
      avoidParentingPattern: "실패할까 봐 미리 다 대신 해주지 마세요.",
      nextAgeExtension: "스스로 목표를 세우고 점검하는 습관으로 이어가세요.",
    },
  },
  talent_execution: {
    toddler: {
      recommendedPlay: ["끝까지 완성하는 블록 놀이", "간단한 미션 완료 놀이"],
      parentQuestions: ["다 만들었어? 어떤 느낌이야?", "다음엔 뭐부터 할까?"],
      experienceActivities: ["작은 목표 정해서 완성해보기"],
      avoidParentingPattern: "중간에 재촉해서 끊지 마세요.",
      nextAgeExtension: "조금 더 긴 시간이 걸리는 활동으로 확장하세요.",
    },
    preschool: {
      recommendedPlay: ["미션형 놀이", "단계별 만들기"],
      parentQuestions: ["끝까지 하니까 어땠어?", "다음 단계는 뭐야?"],
      experienceActivities: ["작은 프로젝트 완성 경험"],
      avoidParentingPattern: "완벽하지 않다고 처음부터 다시 시키지 마세요.",
      nextAgeExtension: "여러 단계로 나뉜 활동을 끝까지 완수해보게 하세요.",
    },
    kindergarten: {
      recommendedPlay: ["장기 프로젝트(주 단위)", "목표 달성 놀이"],
      parentQuestions: ["목표까지 얼마나 왔어?", "끝내고 나니 기분이 어때?"],
      experienceActivities: ["작은 목표를 세우고 체크리스트로 관리해보기"],
      avoidParentingPattern: "속도를 다른 아이와 비교하지 마세요.",
      nextAgeExtension: "스스로 계획을 세우고 완수하는 습관으로 확장하세요.",
    },
  },
  talent_immersion: {
    toddler: {
      recommendedPlay: ["한 가지 놀이에 몰입할 시간 주기"],
      parentQuestions: ["뭐가 제일 재밌었어?", "더 해보고 싶어?"],
      experienceActivities: ["방해받지 않는 자유 놀이 시간"],
      avoidParentingPattern: "몰입 중간에 자주 끊지 마세요.",
      nextAgeExtension: "몰입 시간을 조금씩 늘려주세요.",
    },
    preschool: {
      recommendedPlay: ["레고/퍼즐 단계 늘리기", "그림 오래 그리기"],
      parentQuestions: ["여기서 뭐가 제일 집중됐어?", "다음엔 뭘 더 해보고 싶어?"],
      experienceActivities: ["긴 시간 동안 하는 취미 활동"],
      avoidParentingPattern: "다른 활동으로 자주 전환시키지 마세요.",
      nextAgeExtension: "여러 회차에 걸친 프로젝트로 확장하세요.",
    },
    kindergarten: {
      recommendedPlay: ["장기 취미 활동", "심화 만들기 프로젝트"],
      parentQuestions: ["이 프로젝트에서 제일 몰입됐던 순간은 언제야?"],
      experienceActivities: ["관심 분야 심화 클래스"],
      avoidParentingPattern: "몰입 시간을 다른 일정으로 자주 쪼개지 마세요.",
      nextAgeExtension: "관심 분야를 꾸준히 이어가는 루틴을 만들어주세요.",
    },
  },
  talent_problem_solving: {
    toddler: {
      recommendedPlay: ["간단한 문제 상황 놀이", "미로 찾기"],
      parentQuestions: ["어떻게 하면 될까?", "다른 방법도 있을까?"],
      experienceActivities: ["장애물 넘기 놀이"],
      avoidParentingPattern: "막히면 바로 답을 알려주지 마세요.",
      nextAgeExtension: "조금 더 복잡한 문제 상황으로 확장하세요.",
    },
    preschool: {
      recommendedPlay: ["방탈출식 놀이", "퍼즐/추리 게임"],
      parentQuestions: ["어떤 방법을 시도해봤어?", "안 되면 뭘 바꿔볼까?"],
      experienceActivities: ["보드게임 챌린지"],
      avoidParentingPattern: "실패를 바로 지적하지 말고 다시 시도하게 두세요.",
      nextAgeExtension: "여러 단계를 거치는 문제해결 활동으로 넓혀보세요.",
    },
    kindergarten: {
      recommendedPlay: ["코딩 퍼즐", "전략 게임"],
      parentQuestions: ["막혔을 때 어떻게 풀었어?", "더 좋은 방법이 있었을까?"],
      experienceActivities: ["메이커/코딩 캠프"],
      avoidParentingPattern: "시행착오를 실패로 규정하지 마세요.",
      nextAgeExtension: "직접 문제를 정의하고 풀어보는 프로젝트로 확장하세요.",
    },
  },
};

const GENERIC_FALLBACK: Omit<GrowthActionSet, "groundedInGeneric"> = {
  recommendedPlay: ["아이가 스스로 좋아하는 놀이를 반복해서 즐길 시간 주기"],
  parentQuestions: ["오늘 뭐가 제일 재밌었어?"],
  experienceActivities: ["아이의 관심사를 따라가는 나들이"],
  avoidParentingPattern: "아직 이 연령대 전용 활동 데이터가 준비되지 않았어요.",
  nextAgeExtension: "관찰이 더 쌓이면 더 구체적인 활동을 안내해 드릴게요.",
};

function toCoreBand(band: AgeBand): CoreBand | null {
  if (band === "toddler" || band === "preschool" || band === "kindergarten") return band;
  return null;
}

export function getGrowthActionSet(talentId: TalentId, ageBand: AgeBand): GrowthActionSet {
  const core = toCoreBand(ageBand);
  if (!core) return { ...GENERIC_FALLBACK, groundedInGeneric: true };
  const curated = CURATED[talentId]?.[core];
  if (!curated) return { ...GENERIC_FALLBACK, groundedInGeneric: true };
  return { ...curated, groundedInGeneric: false };
}

export { CORE_BANDS };
