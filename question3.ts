import { ForExp, AppExp, Exp, Program, makeProcExp, isProcExp, isIfExp, 
         isAppExp, makeAppExp, makeNumExp, isForExp, isDefineExp, 
         CExp, makeDefineExp, makeIfExp, isProgram, makeProgram} from "./L21-ast";
import { Result, makeFailure, bind, makeOk, safe3, safe2, mapResult } from "../imp/result";
import { isEmpty } from "../imp/list";

/*
Purpose: transform a ForExp into AppExp
Signature: for2app(exp)
Type: [ForExp -> AppExp]
*/
export const for2app = (exp: ForExp): AppExp =>{
    let arr: AppExp[] = [];
    for (let index = exp.start.val; index <= exp.end.val; index++) {
        isForExp(exp.body) ? arr = arr.concat(makeAppExp(makeProcExp([exp.var],[for2app(exp.body)]),[makeNumExp(index)])) :
        arr = arr.concat(makeAppExp(makeProcExp([exp.var],[exp.body]),[makeNumExp(index)]));
    }
    return makeAppExp(makeProcExp([], arr), []);
}

/*
Purpose: convert L21-AST to an equivelent L2-AST
Signature: L21ToL2(exp)
Type: [Exp | Program -> Result<Exp|Program>]
*/
export const L21ToL2 = (exp: Exp | Program): Result<Exp | Program> =>
    isEmpty(exp) ?  makeFailure("Expression can not be empty") :
    isProgram(exp) ? bind(mapResult(L21ExpToL2, exp.exps), (exps: Exp[]) => makeOk(makeProgram(exps))) : 
    L21ExpToL2(exp)


const L21ExpToL2 = (exp : Exp) : Result<Exp> =>
    isDefineExp(exp) ? bind(L21CExpToL2(exp.val), (value: CExp) => makeOk(makeDefineExp(exp.var, value))) :
    L21CExpToL2(exp)

    
const L21CExpToL2 = (exp : CExp) : Result<CExp> =>
    isForExp(exp) ? makeOk(for2app(exp)) :
    isIfExp(exp) ? safe3((test: CExp, then: CExp, alt: CExp) => makeOk(makeIfExp(test,then,alt)))
                    (L21CExpToL2(exp.test),L21CExpToL2(exp.then), L21CExpToL2(exp.alt)) :
    isAppExp(exp) ? safe2((rator: CExp, rands: CExp[]) => makeOk(makeAppExp(rator, rands)))
                    (L21CExpToL2(exp.rator), mapResult(L21CExpToL2, exp.rands)) :
    isProcExp(exp) ? bind(mapResult(L21CExpToL2, exp.body),
                    (cexps: CExp[]) => makeOk(makeProcExp(exp.args, cexps))) :
    makeOk(exp) //atomic exp
