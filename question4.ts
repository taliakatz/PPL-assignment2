import { Exp, Program, isProgram, isBoolExp, isNumExp, isVarRef, isPrimOp, isDefineExp, isProcExp, isIfExp, isAppExp, ProcExp, AppExp} from '../imp/L2-ast';
import { Result, bind, mapResult, makeOk, safe3, safe2, makeFailure } from '../imp/result';
import { map } from 'ramda';

/*
Purpose: transform a L2 program to JavaScript program
Signature: l2ToJS(exp)
Type: [Exp | Program -> Result<string>]
*/
export const l2ToJS = (exp: Exp | Program): Result<string> => 
    isProgram(exp) ? programToJS(exp) :
    isBoolExp(exp) ? makeOk(exp.val ? "true" : "false") :
    isNumExp(exp) ? makeOk(exp.val.toString()) :
    isVarRef(exp) ? makeOk(exp.var) :
    isPrimOp(exp) ? makeOk(exp.op) :
    isDefineExp(exp) ? bind(l2ToJS(exp.val), (val: string) => makeOk(`const ${exp.var.var} = ${val}`)) :
    isProcExp(exp) ? procToJS(exp):
    isIfExp(exp) ? safe3((test: string, then: string, alt: string) => makeOk(`(${test} ? ${then} : ${alt})`))
                    (l2ToJS(exp.test), l2ToJS(exp.then), l2ToJS(exp.alt)) :
    isAppExp(exp) ? AppToJS(exp) :
    makeFailure(`Unknown expression: ${exp}`);

const programToJS = (exp : Program) : Result<string> =>{
    return bind(mapResult(l2ToJS, exp.exps), (exps: string[]) => {
        exps[exps.length-1] = "console.log(".concat(exps[exps.length-1].concat(");"));
        return makeOk(exps.join(";\n"));
    })
}
    
const procToJS = (exp: ProcExp): Result<string> =>{
    if (exp.body.length === 1) 
        return bind(mapResult(l2ToJS, exp.body), (body: string[]) => makeOk(`((${map(v => v.var, exp.args).join(",")}) => ${body.join(" ")})`));
    return bind(mapResult(l2ToJS, exp.body), (body: string[]) =>{
                body[body.length-1] = "return ".concat(body[body.length-1]).concat(";");
                return makeOk(`((${map(v => v.var, exp.args).join(",")}) => {${body.join("; ")}})`)});
}


const AppToJS = (exp: AppExp): Result<string> =>
    isPrimOp(exp.rator) ?(
    (exp.rator.op === "=" || exp.rator.op === "eq?" ) ?
        safe2((rator: string, rands: string[]) =>  makeOk(`(${rands.join(` === `)})`))
                                             (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) : 
    exp.rator.op === "not" ?
        safe2((rator: string, rands: string[]) =>  makeOk(`(!${rands})`))
                                            (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
    exp.rator.op === "and" ?
        safe2((rator: string, rands: string[]) =>  makeOk(`(${rands.join(` && `)})`))
                                            (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :  
    exp.rator.op === "or" ?
        safe2((rator: string, rands: string[]) =>  makeOk(`(${rands.join(` || `)})`))
                                                (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :  
    exp.rator.op === "number?" ?
        safe2((rator: string, rands: string[]) =>  makeOk(`(typeof ${rands} === 'number')`))
                                            (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
    exp.rator.op === "boolean?" ?
        safe2((rator: string, rands: string[]) =>  makeOk(`(typeof ${rands} === 'boolean')`))
                                            (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :  
    safe2((rator: string, rands: string[]) =>  makeOk(`(${rands.join(` ${rator} `)})`))
                                             (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) ):
    safe2((rator: string, rands: string[]) => makeOk(`${rator}(${rands.join(",")})`))
                                                 (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands))



