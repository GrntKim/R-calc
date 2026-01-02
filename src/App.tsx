import { useEffect, useRef, useState } from 'react';
import './App.css'

function App() {
  const [expression, setExpression] = useState<string>('0');
  const [isResult, setIsResult] = useState<boolean>(false);
  const [beforeFlipped, setBeforeFlipped] = useState<string>('');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const operators: string[] = ['+', '-', '×', '÷', '%'];

  const handleInput = (input: string) => {
    if (isResult) {
      setIsResult(false);
      if (!isNaN(+input) || input === '.') {
        const nextValue = input === '.' ? '0.' : input;
        setExpression(nextValue);
        return;
      }
    }
    setExpression(prev => {
      const lastChar: string = prev[prev.length - 1];
      const secondLastChar: string = prev[prev.length - 2];
      
      if (operators.includes(input)) {
        setIsFlipped(false);
        if (input !== '-') {
          if (prev === '-') {
            return '0';
          }
          if (lastChar === '-' && operators.includes(secondLastChar)) {
            return prev.slice(0, -2) + input;
          }
          if (operators.includes(lastChar)) {
            return prev.slice(0, -1) + input;
          }
        } else if (input === '-') {
          if (prev === '0') return input;
          // prevent --
          if (lastChar === '-') return prev;
          return prev + input;
        }
      }

      // handle decimal
      if (input === '.') {
        // prevent continuous decimal a..b
        if (lastChar === '.') return prev;

        const tokens: string[] = prev.split(/(\+|-|÷|%|×)/);
        const lastNumber: string = tokens[tokens.length - 1];

        // prevent multiple decimal a.b.c
        if (lastNumber.includes('.')) return prev;
      }

      if (prev === '0') {
        if (input === '0' || operators.includes(input)) return prev;
        else if (input !== '.') return input;
      }

      return prev + input;
    });
  }

  const handleSign = () => {
    if (isFlipped) {
      setExpression(beforeFlipped);
      setIsFlipped(false);
      return;
    }
    setExpression(prev => {
      setBeforeFlipped(prev);
      const tokens: string[] = prev.split(/(\+|-|÷|%|×)/);
      const lastNumber: string = tokens[tokens.length - 1];
      if (isNaN(+lastNumber)) return prev;
      if (!lastNumber || lastNumber === '0') return prev;
      const toggledNumber: string = lastNumber.startsWith('-')
        ? lastNumber.slice(1)
        : '-' + lastNumber;
      const newTokens: string[] = [...tokens];
      newTokens[newTokens.length - 1] = toggledNumber;
      setIsFlipped(true);
      return newTokens.join('');
    });
  }

  const handleEqual = () => {
    const rawTokens: string[] = expression.split(/(\+|-|÷|%|×)/)
      .filter(t => t.trim() !== "");

    const processedTokens: string[] = [];

    for (let i = 0; i < rawTokens.length; i++) {
      const token: string = rawTokens[i];

      // if current token is - and (is head of expression or right behind another operation)
      if (token === '-' && (i === 0 || operators.includes(rawTokens[i-1]))) {
        // merge the minus sign. That token is not a subtraction op
        const nextToken: string = rawTokens[i+1];
        processedTokens.push(token + nextToken);
        i++;
      } else {
        // else just push
        processedTokens.push(token);
      }
    }

    try {
      console.log(processedTokens);
      const postfix = convertToPostfix(processedTokens);
      console.log(postfix);
      const result: number = calculatePostfix(postfix);
      setExpression(String(+result.toFixed(6)));
      setIsResult(true);
      setIsFlipped(false);
    } catch (error) {
      setExpression("Error: " + error);
    }
  }

  const convertToPostfix = (tokens: string[]) => { 
    const priority: Record<string, number> = { '+': 1, '-': 1, '×': 2, '÷': 2, '%': 2 };
    const output: string[] = [];
    const stack: string[] = [];

    tokens.forEach(token => {
      if (!operators.includes(token)) { // number token
        output.push(token);
      } else {
        while (stack.length > 0 && priority[stack[stack.length-1]] >= priority[token]) {
          output.push(stack.pop()!);
        }
        stack.push(token);
      }
    });

    while (stack.length > 0) output.push(stack.pop()!);
    return output; 
  }
  const calculatePostfix = (postfix: string[]) => { 
    const stack: number[] = [];

    postfix.forEach(token => {
      if (!operators.includes(token)) {
        stack.push(+token);
      } else {
        const b = stack.pop()!;
        const a = stack.pop()!;

        switch (token) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '×': stack.push(a * b); break;
          case '÷': stack.push(a / b); break;
          case '%': stack.push(a % b); break;
        }
      }
    });
    return stack[0];
  }

  const handleBackspace = () => { 
    setIsResult(false);
    setIsFlipped(false);

    if (expression.length == 1) setExpression('0');
    else if (expression !== '0' && expression.length)
      setExpression(expression.slice(0, -1));
  }

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
    console.clear();
    console.log(expression.length);
    console.log(expression);
  }, [expression]);

  const btnStyle = "h-14 rounded-full flex items-center justify-center text-lg font-semibold active:opacity-70 transition-all";
  const numBtn = `${btnStyle} bg-zinc-400 text-black hover:bg-white`;
  const opBtn = `${btnStyle} bg-orange-500 text-black hover:bg-orange-400`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white">
      <h1 className="mb-6 font-light text-zinc-500 uppercase">Calculator</h1>
      
      <div className="w-72 bg-black p-4 rounded-3xl border border-zinc-800 shadow-2xl">
        <div ref={scrollRef} className="w-full overflow-x-auto whitespace-nowrap text-right text-5xl p-2 scrollbar-hide">
          {expression || '0'}
        </div>
        <div className="grid grid-cols-4 gap-3">
          <button onClick={handleBackspace} className={opBtn}>←</button>
          <button onClick={() => {setExpression('0'); setIsResult(false)}} className={opBtn}>AC</button>
          <button onClick={() => handleInput('%')} className={opBtn}>%</button>
          <button onClick={() => handleInput('÷')} className={opBtn}>÷</button>

          <button onClick={() => handleInput('7')} className={numBtn}>7</button>
          <button onClick={() => handleInput('8')} className={numBtn}>8</button>
          <button onClick={() => handleInput('9')} className={numBtn}>9</button>
          <button onClick={() => handleInput('×')} className={opBtn}>×</button>

          <button onClick={() => handleInput('4')} className={numBtn}>4</button>
          <button onClick={() => handleInput('5')} className={numBtn}>5</button>
          <button onClick={() => handleInput('6')} className={numBtn}>6</button>
          <button onClick={() => handleInput('-')} className={opBtn}>-</button>

          <button onClick={() => handleInput('1')} className={numBtn}>1</button>
          <button onClick={() => handleInput('2')} className={numBtn}>2</button>
          <button onClick={() => handleInput('3')} className={numBtn}>3</button>
          <button onClick={() => handleInput('+')} className={opBtn}>+</button>

          <button onClick={handleSign} className={opBtn}>+/-</button>
          <button onClick={() => handleInput('0')} className={numBtn}>0</button>
          <button onClick={() => handleInput('.')} className={opBtn}>.</button>
          <button onClick={handleEqual} className={opBtn}>=</button>
          </div>
        </div>
      </div>
  )
}

export default App;