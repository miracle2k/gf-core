--# -path=.:../chunk:alltenses

concrete TranslateSpa of Translate = 
  TenseSpa,
  NounSpa - [
    PPartNP
    ,UsePron -- override with a prodrop variant
    ],
  AdjectiveSpa,
  NumeralSpa,
  SymbolSpa [
    PN, Symb, String, CN, Card, NP, MkSymb, SymbPN, CNNumNP
    ],
  ConjunctionSpa,
  VerbSpa -  [
    UseCopula,  
    PassV2  -- generalized in Extensions
    ],
  AdverbSpa,
  PhraseSpa,
  SentenceSpa,
  QuestionSpa,
  RelativeSpa,
  IdiomSpa,
--  ConstructionSpa,
  DocumentationSpa,

  ChunkSpa,
  ExtensionsSpa [CompoundCN,AdAdV,UttAdV,ApposNP,MkVPI, MkVPS, PredVPS, PassVPSlash, PassAgentVPSlash, CompoundAP],

  DictionarySpa ** 
open MorphoSpa, ResSpa, ParadigmsSpa, SyntaxSpa, (E = ExtraSpa), (G = GrammarSpa), Prelude in {

flags
  literal=Symb ;

-- the overrides -----
lin

 UsePron p = G.UsePron p | G.UsePron (E.ProDrop p) ;

}
