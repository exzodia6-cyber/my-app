export type Rarity = 'CONSUMER_GRADE'|'INDUSTRIAL_GRADE'|'MIL_SPEC'|'RESTRICTED'|'CLASSIFIED'|'COVERT'|'RARE_SPECIAL_ITEM';
export type Item = { id:string; weapon:string; skin:string; rarity:Rarity; price:number; imageUrl:string; wear:string };
export type CaseItem = { id:string; chance:number; item:Item };
export type Case = { id:string; name:string; description:string; price:number; imageUrl:string; accentColor:string; items:CaseItem[] };
export type InventoryItem = { id:string; acquiredAt:string; item:Item };
export type User = { id:string; email:string; username:string; role:'USER'|'ADMIN'; balance:number };
export type History = { id:string; type:string; title:string; metadata:Record<string, unknown>; createdAt:string };
