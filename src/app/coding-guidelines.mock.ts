import { ICodingGuidelineItem } from "./icoding-guideline-item"

export const GUIDELINES:ICodingGuidelineItem[] = [
    {
        name:"Aide document",
        prefix:"AIDE_",
        case:"*[Projet/Groupe]_Snake_Case",
        exemple:"",
        sheetName: "test"
    },
    {
        name:"Classe WINDEV",
        prefix:"c",
        case:"*[Projet/Groupe]CamelCase",
        exemple:"",
        sheetName: "test"
    },
    {
        name:"Collection de procédures WINDEV",
        prefix:"PG_XX_",
        case:"*[Projet/Groupe]_CamelCase",
        exemple:"",
        sheetName: "test"
    },
]