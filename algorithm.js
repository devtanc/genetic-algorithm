"use strict";
let haveInt = false;
let goal;

process.argv.forEach((val, index, array) => {
  if(parseInt(val)) {
    haveInt = true;
    goal = parseInt(val);
  }
});

if(!haveInt) { console.log('No number provided in args'); process.exit(1); }
else { console.log('Finding best algorithm for matching', goal); }

const variables = ['0','1','2','3','4','5','6','7','8','9','+','-','*','/'];
const operands = {
  '+': function (x, y) { return x + y },
  '-': function (x, y) { return x - y },
  '*': function (x, y) { return x * y },
  '/': function (x, y) { return x / y },
}

let candidates = [];
let generation = 1;
let found = false;

for(let i = 0; i < 12; i++) {
  candidates.push({encoding: randomizeCandidate()});
}

candidates.forEach(candidate => calculateFitness(candidate));
candidates = candidates.sort(highToLow);
candidates.forEach(candidate => {if(candidate.fitness === 2) found = true;})

while(!found) {
  let sum = candidates.reduce(sumFitness, 0);
  let avg = sum / candidates.length;
  console.log('//********** Generation', generation++, '**********//', avg.toFixed(5));
  printCurrentGenerationShort(candidates);
  let next = candidates.slice(0,2);
  let children = createChildren(next.map(item => item.encoding));
  candidates = candidates.map(candidate => candidate.encoding)
  candidates.splice(candidates.length - 2, 2, children[0], children[1]);
  candidates = candidates.map(encoding => { return {encoding}});
  candidates.forEach(candidate => calculateFitness(candidate));
  candidates = candidates.sort(highToLow);
  candidates.forEach(candidate => {if(candidate.fitness === 2) found = true;});
}

candidates.forEach(candidate => {
  if(candidate.fitness === 2) {
    console.log(':::::: CANDIDATE FOUND ::::::');
    console.log(candidate);
    console.log(':::::: CANDIDATE FOUND ::::::');
  }
});

function sumFitness(a,b) {
  if(b.fitness) return a + b.fitness
  else return a
}

function randomizeCandidate() {
  let candidate = [];
  let geneCount = Math.floor(Math.random() * 10 + 1);
  for (let i = 0; i < geneCount; i++) {
    candidate.push(getRandomVariable())
  }
  console.log(candidate);
  return candidate;
}

function getRandomVariable() {
  return variables[Math.floor(Math.random() * 13 + 1)];
}

function calculateFitness(candidate) {
  let result = candidate.encoding.reduce((prev, current, index, array) => {
    if (!prev) {console.log(prev, current, index, array)}
    //If we're looking for an integer and current is one
    if(prev.findInt && parseInt(current)) {
      //Immediately switch flag for whether finding an int or an operand
      prev.findInt = !prev.findInt;
      //If we don't yet have an initial value
      if(!prev.value) {
        prev.value = parseInt(current);
        return prev;
      }
      //If there is a stored operand
      if(prev.operand) {
        //If there is a value and there is an operand then perform the maths
        prev.value = operands[prev.operand](prev.value, parseInt(current));
        //Clear the operand
        prev.operand = undefined;
        return prev;
      }
    }
    //If we're looking for an operand and this is one
    else if(!prev.findInt && !parseInt(current)) {
      //Immediately switch flag for whether finding an int or an operand
      prev.findInt = !prev.findInt;
      if(!prev.operand) {
        prev.operand = current;
        return prev;
      }
    }
    //Otherwise skip whatever the current item is
    prev.penalty += 0.05;
    return prev;
  }, {findInt: true, operand: undefined, value: undefined, penalty: 0});
  let fitness = 0;
  if(result.value) { goal - result.value === 0 ? fitness = 2 : fitness = Math.abs(1 / (goal - result.value)); }
  else { fitness = 0; }
  if(fitness > 0 && result.penalty) {
    fitness -= result.penalty
  }
  candidate.result = result.value;
  candidate.fitness = isNaN(fitness) ? 0 : fitness;
}


function printCurrentGenerationShort(candidates) {
  candidates.forEach((candidate, index) => {
    console.log('/** Candidate', index + 1, '**/\t', candidate.result ? candidate.result.toFixed(2) : candidate.result, '   \t:', candidate.fitness);
  })
}

function printEncodings(candidates) {
  candidates.forEach((candidate, index) => {
    console.log('/** Candidate', index + 1, '**/\t', candidate);
  })
}

function highToLow(a, b) {
  return b.fitness - a.fitness;
}

function createChildren(set) {
  set = crossover(set);
  if(Math.random() <= 0.4) {
    mutate(set);
  }
  return set;
}

function crossover(set) {
  let shorter = Array.from(set[0].length < set[1].length ? set[0] : set[1]);
  let longer = Array.from(set[0].length < set[1].length ? set[1] : set[0]);
  for(let i = 0; i < shorter.length; i++) {
    if(Math.random() <= 0.5) {
      let temp = shorter[i];
      shorter[i] = longer[i];
      longer[i] = temp;
    }
  }
  return [shorter, longer];
}

function mutate(set) {
  set.forEach((item) => {
    let mutating = true;
    if(Math.random() <= 0.5) {
      while(mutating) {
        if(Math.random() <= 0.55) {
          item.push(getRandomVariable());
        } else {
          item.pop();
        }
        let selection = Math.floor(Math.random() * item.length);
        item[selection] = getRandomVariable();
        if(Math.random() <= 0.6) { mutating = false; }
      }
    }
  })
}

// function printCurrentGenerationDebug(candidates) {
//   console.log('********** BEGIN CANDIDATES **********');
//   candidates.forEach((candidate, index) => {
//     console.log('/** Candidate', index + 1, '**/');
//     Object.keys(candidate).forEach(key => {
//       console.log(key + ':', candidate[key]);
//     });
//   })
//   console.log('********** END CANDIDATES **********');
// }

// function getNextGenCandidatesRoulette(candidates) {
//   let maxVal = candidates.reduce((prev, current) => {
//     return prev + current.fitness;
//   }, 0);
//   console.log('Maximum roulette value:' + maxVal);
//   let decision = Math.random() * maxVal;
//   console.log('Decision:' + decision);

// }