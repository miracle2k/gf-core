
$infile = $#ARGV >= 0 ? '@'.join('@, @', @ARGV).'@' : '/the input file/';

print <<EOF;
----------------------------------------------------------------------
-- |
-- Module      : HelpFile
-- Maintainer  : Aarne Ranta
-- Stability   : Stable (Autogenerated)
-- Portability : Haskell 98
--
-- > CVS \$Date \$
-- > CVS \$Author \$
-- > CVS \$Revision \$
--
-- Help on shell commands. Generated from $infile by invoking the 
-- perl script \@mkHelpFile.perl\@.
-- Automatically generated -- PLEASE DON'T EDIT THIS FILE,
-- edit $infile instead.
-----------------------------------------------------------------------------

module HelpFile (txtHelpFileSummary, txtHelpCommand, txtHelpFile) where

import Operations

txtHelpFileSummary :: String
txtHelpFileSummary =
  unlines \$ map (concat . take 1 . lines) \$ paragraphs txtHelpFile

txtHelpCommand :: String -> String
txtHelpCommand c =
  case lookup c [(takeWhile (/=',') p,p) | p <- paragraphs txtHelpFile] of
    Just s -> s
    _ -> "Command not found."

txtHelpFile :: String
txtHelpFile =
EOF

while (<>) {
  chop;
  s/([\"\\])/\\$1/g;
  $pref = /^ / ? "\\n" : "\\n";
  print "  \"$pref$_\" ++\n";
}

print "  []\n";


