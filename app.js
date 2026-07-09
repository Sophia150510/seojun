import { firebaseConfig } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM 요소 취득
const form = document.getElementById("info-form");
const submitBtn = document.getElementById("submit-btn");
const submitText = document.getElementById("submit-text");
const submitSpinner = document.getElementById("submit-spinner");
const field1Input = document.getElementById("field1");
const charCount = document.getElementById("char-count");

const formContainer = document.getElementById("form-container");
const successContainer = document.getElementById("success-container");
const errorContainer = document.getElementById("error-container");
const errorAlertDesc = document.getElementById("error-alert-desc");
const resetBtn = document.getElementById("reset-btn");
const errorResetBtn = document.getElementById("error-reset-btn");

// 에러 노출용 엘리먼트
const nameError = document.getElementById("name-error");
const phoneError = document.getElementById("phone-error");
const emailError = document.getElementById("email-error");
const field1Error = document.getElementById("field1-error");

// 정규식 상수
const PHONE_REGEX = /^01[016789]-\d{3,4}-\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 실시간 글자수 제한 감지 (참고사항)
field1Input.addEventListener("input", () => {
  const currentLength = field1Input.value.length;
  charCount.textContent = currentLength;

  if (currentLength > 500) {
    charCount.style.color = "var(--error)";
    field1Error.textContent = "참고사항은 500자 이내로 입력해 주세요.";
    field1Error.style.display = "block";
    field1Input.classList.add("is-invalid");
  } else {
    charCount.style.color = "var(--text-muted)";
    field1Error.style.display = "none";
    field1Input.classList.remove("is-invalid");
  }
});

// 입력란 필드 에러 실시간 초기화 이벤트
const textInputs = [form.name, form.phone, form.email];
textInputs.forEach(input => {
  input.addEventListener("input", () => {
    if (input.classList.contains("is-invalid")) {
      input.classList.remove("is-invalid");
      const errEl = document.getElementById(`${input.name}-error`);
      if (errEl) errEl.style.display = "none";
    }
  });
});

// 클라이언트 검증 로직
function validateForm() {
  let isValid = true;

  // 이름 검증
  const nameVal = form.name.value.trim();
  if (!nameVal) {
    nameError.textContent = "이름은 필수 입력 항목입니다.";
    nameError.style.display = "block";
    form.name.classList.add("is-invalid");
    isValid = false;
  } else if (nameVal.length > 50) {
    nameError.textContent = "이름은 50자 이내로 입력해 주세요.";
    nameError.style.display = "block";
    form.name.classList.add("is-invalid");
    isValid = false;
  } else {
    nameError.style.display = "none";
    form.name.classList.remove("is-invalid");
  }

  // 전화번호 검증
  const phoneVal = form.phone.value.trim();
  if (!phoneVal) {
    phoneError.textContent = "전화번호는 필수 입력 항목입니다.";
    phoneError.style.display = "block";
    form.phone.classList.add("is-invalid");
    isValid = false;
  } else if (!PHONE_REGEX.test(phoneVal)) {
    phoneError.textContent = "전화번호 형식(예: 010-1234-5678)에 맞게 입력해 주세요.";
    phoneError.style.display = "block";
    form.phone.classList.add("is-invalid");
    isValid = false;
  } else {
    phoneError.style.display = "none";
    form.phone.classList.remove("is-invalid");
  }

  // 이메일 검증
  const emailVal = form.email.value.trim();
  if (emailVal && !EMAIL_REGEX.test(emailVal)) {
    emailError.textContent = "올바른 이메일 형식이 아닙니다. (예: email@domain.com)";
    emailError.style.display = "block";
    form.email.classList.add("is-invalid");
    isValid = false;
  } else {
    emailError.style.display = "none";
    form.email.classList.remove("is-invalid");
  }

  // 참고사항 검증
  const field1Val = field1Input.value;
  if (field1Val.length > 500) {
    field1Error.textContent = "참고사항은 500자 이내로 입력해 주세요.";
    field1Error.style.display = "block";
    field1Input.classList.add("is-invalid");
    isValid = false;
  } else {
    field1Error.style.display = "none";
    field1Input.classList.remove("is-invalid");
  }

  return isValid;
}

// 폼 서브밋 핸들러
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  // 저장 중 상태 변경 (중복 제출 방지)
  submitBtn.disabled = true;
  submitSpinner.classList.remove("hidden");
  submitText.textContent = "저장 중...";

  const submission = {
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    field1: field1Input.value,
    createdAt: serverTimestamp()
  };

  try {
    // submissions 컬렉션에 데이터 저장
    await addDoc(collection(db, "submissions"), submission);
    
    // 성공 시 폼 숨기고 완료 화면 노출
    formContainer.classList.add("hidden");
    successContainer.classList.remove("hidden");
  } catch (error) {
    console.error("Firestore 저장 실패:", error);
    
    formContainer.classList.add("hidden");
    errorContainer.classList.remove("hidden");

    if (error.code === "permission-denied") {
      errorAlertDesc.textContent = "Firestore 보안 규칙이 적용되지 않았습니다. 배포 가이드 3단계를 확인하세요.";
    } else {
      errorAlertDesc.textContent = `데이터를 저장하는 중 오류가 발생했습니다. (${error.message || '네트워크 오류'})`;
    }
  } finally {
    // 상태 원복
    submitBtn.disabled = false;
    submitSpinner.classList.add("hidden");
    submitText.textContent = "제출하기";
  }
});

// 입력 폼 리셋 및 되돌아가기
function resetForm() {
  form.reset();
  charCount.textContent = "0";
  charCount.style.color = "var(--text-muted)";
  
  // 모든 에러 메시지 감춤 및 클래스 제거
  const errorElements = [nameError, phoneError, emailError, field1Error];
  errorElements.forEach(err => { if (err) err.style.display = "none"; });
  
  const invalidFields = form.querySelectorAll(".is-invalid");
  invalidFields.forEach(field => field.classList.remove("is-invalid"));

  // 화면 리셋
  successContainer.classList.add("hidden");
  errorContainer.classList.add("hidden");
  formContainer.classList.remove("hidden");
}

resetBtn.addEventListener("click", resetForm);
errorResetBtn.addEventListener("click", resetForm);