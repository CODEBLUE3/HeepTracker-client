import styled from "styled-components";
import CodeInput from "../component/CodeInput";
import CodeExecution from "../component/CodeExecution";
import CodeResult from "../component/CodeResult";
import { useState, useEffect } from "react";
import { color, style } from "../styles/styleCode";

const Container = styled.div`
  flex-direction: column;
  height: 100%;
`;

const ExecButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${color.defaultBoxBackground};
  font-size: 1.3rem;
  background-color: ${color.defaultButton};
  border: none;
  border-radius: 20px;
  margin: ${style.defaultComponentMargin};
  margin-top: 40px;
  width: 15%;
`;

const RowContainer = styled.div`
  display: flex;
`;

export default function UserEditor() {
  const [userInput, setUserInput] = useState("");
  const [userExecution, setUserExecution] = useState("");
  const [codeResult, setCodeResult] = useState({});

  function handleUserInput(value) {
    setUserInput(value);
  }

  function handleUserExeution(value) {
    setUserExecution(value);
  }

  function sendCode() {
    window.electronAPI.validateUserCode(userInput, userExecution);
    window.electronAPI.validateUserCodeReply(setCodeResult);
  }

  useEffect(() => {
    if (!codeResult.isError) {
      window.electronAPI.executeHeapTracker(userInput, userExecution);
    }
  }, [codeResult]);

  return (
    <Container>
      <CodeInput value={userInput} onChange={handleUserInput} />
      <RowContainer>
        <CodeExecution value={userExecution} onChange={handleUserExeution} />
        <ExecButton onClick={sendCode}>실행</ExecButton>
      </RowContainer>
      <CodeResult result={codeResult} />
    </Container>
  );
}
