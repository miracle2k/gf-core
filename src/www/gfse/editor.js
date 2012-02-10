

var editor=element("editor");

/* -------------------------------------------------------------------------- */

function initial_view() {
    var current=local.get("current");
    if(current>0) open_grammar(current-1);
    else draw_grammar_list();
    //debug(local.get("dir","no server directory yet"));
}

function draw_grammar_list() {
    local.put("current",0);
    editor.innerHTML="";
    var uploaded=local.get("dir") && local.get("json_uploaded");
    var cloud_upload=
	a(jsurl("upload_json()"),
	  [node("img",{"class":"cloud",
		       src:"P/1306856253_weather_06.png",alt:"[Up Cloud]",
		       title: uploaded
		               ? "Click to upload grammar updates to the cloud"
		               : "Click to store your grammars in the cloud"},
		    [])]);
    var home=div_class("home",[node("h3",{},
				    [text("Your grammars"),cloud_upload])]);
    if(uploaded) {
	var cloud_download=
	    a(jsurl("download_json()"),
	      [node("img",{"class":"cloud",
			   src:"P/1307545089_weather_04.png",alt:"[Down Cloud]",
			   title:"Click to download grammar updates from the cloud"},
		    [])]);
	insertAfter(cloud_download,cloud_upload);
    }
    editor.appendChild(home)
    function del(i) { return function () { delete_grammar(i); } }
    function clone(i) { return function (g,b) { clone_grammar(i); } }
    function new_extension(i) { return function (g,b) { new_grammar([g]) }}
    function item(i,grammar) {
	var link=a(jsurl("open_grammar("+i+")"),[text(grammar.basename)]);
	return node("tr",{"class":"extensible deletable"},
		    [td(delete_button(del(i),"Delete this grammar")),
		     td(link),
		     td(more(grammar,clone(i),"Clone this grammar")),
		     td(more(grammar,new_extension(i),"Create an extension of this grammar"))])
    }
    if(local.get("count",null)==null)
	home.appendChild(text("You have not created any grammars yet."));
    else if(local.count==0)
	home.appendChild(text("Your grammar list is empty."));
    else {
	var rows=[];
	for(var i=0;i<local.count;i++) {
	    var grammar=local.get(i,null);
	    if(grammar && grammar.basename) rows.push(item(i,grammar))
	}
	home.appendChild(node("table",{"class":"grammar_list"},rows));
    }

    home.appendChild(
	ul([li([a(jsurl("new_grammar()"),[text("New grammar")])])]));
    //editor.appendChild(text(local.count));
    home.appendChild(empty_id("div","sharing"));
}

function new_grammar(gs) {
    gs=gs || [];
    var g={basename:"Unnamed",
	   extends:gs.map(function(g){return g.basename}),
	             // check that "Unnamed" is not in exts !!
	   abstract:{cats:[],funs:[]},
	   concretes:empty_concretes_extending(gs)}
    edit_grammar(g);
}

function empty_concretes_extending(gs) {
    var concs=[]
    var langs=[];
    for(var i in gs) {
	var g=gs[i];
	for(var ci in g.concretes) {
	    var conc=g.concretes[ci];
	    var code=conc.langcode;
	    if(!langs[code])
		langs[code]=true,concs.push(new_concrete(code))
	}
    }
    return concs
}

function remove_local_grammar(i) {
    local.remove(i);
    while(local.count>0 && !local.get(local.count-1))
	local.count--;
}

function delete_grammar(i) {
    var g=local.get(i);
    var ok=confirm("Do you really want to delete the grammar "+g.basename+"?")
    if(ok) {
	remove_local_grammar(i)
	remove_cloud_grammar(g)
	initial_view();
    }
}

function clone_grammar(i) {
    var old=local.get(i);
    var g={basename:old.basename,abstract:old.abstract,concretes:old.concretes}
    save_grammar(g);
    draw_grammar_list();
}

function open_grammar(i) {
    var g=local.get(i);
    g.index=i;
    local.put("current",i+1);
    edit_grammar(g);
}

function close_grammar(g) {
    var o=element("compiler_output");
    if(o) o.innerHTML="";
    save_grammar(g);
    draw_grammar_list();
}
function reload_grammar(g) { save_grammar(g);  edit_grammar(g); }

function save_grammar(g) {
    if(g.index==null) g.index=local.count++;
    local.put(g.index,g);
}

function edit_grammar(g) {
    editor.innerHTML="";
    editor.appendChild(draw_grammar(g));
}


function draw_grammar(g) {
    var files=div_class("files",[draw_filebar(g),draw_file(g)]);
    return div_class("grammar",[draw_namebar(g,files),files])

}

function draw_namebar(g,files) {
    return div_class("namebar",
		  [table([tr([td(draw_name(g)),
			      td_right([upload_button(g),
					draw_plainbutton(g,files),
					draw_closebutton(g)])])])])
}

function draw_name(g) {
    return editable("h3",text(g.basename),g,edit_name,"Rename grammar");
}

function draw_closebutton(g) {
    var b=button("X",function(){close_grammar(g);});
    b.title="Save and Close this grammar";
    return b;
}

function draw_plainbutton(g,files) {
    var b2;
    function show_editor() { edit_grammar(g); }
    function show_plain() {
	files.innerHTML="<pre class=plain>"+show_grammar(g)+"</pre>"
	b.style.display="none";
	if(b2) b2.style.display="";
	else {
	    b2=button("Show editor",show_editor);
	    insertAfter(b2,b);
	}
    }
    var b=button("Show plain",show_plain);
    b.title="Show plain text representaiton of the grammar";
    return b;
}

function upload_button(g) {
    var b=button("Compile",function(){upload(g);});
    b.title="Upload the grammar to the server to check it in GF and test it in the minibar";
    return b;
}

function lang(code,name) { return { code:code, name:name} }
function lang1(name) {
    var ws=name.split("/");
    return ws.length==1 ? lang(name.substr(0,3),name) : lang(ws[0],ws[1]);
}
var languages =
    map(lang1,"Amharic Arabic Bulgarian Catalan Danish Dutch English Finnish French German Hindi Ina/Interlingua Italian Latin Norwegian Polish Ron/Romanian Russian Spanish Swedish Thai Turkish Urdu".split(" "));
languages.push(lang("Other","Other"));

var langname={};
for(var i in languages)
    langname[languages[i].code]=languages[i].name

function concname(code) { return langname[code] || code; }

function add_concrete(g,el) {
    var file=element("file");
    file.innerHTML="";
    var dc={};
    for(var i in g.concretes)
	dc[g.concretes[i].langcode]=true;
    var list=[]
    for(var i in languages) {
	var l=languages[i], c=l.code;
	if(!dc[c])
	    list.push(li([a(jsurl("add_concrete2("+g.index+",'"+c+"')"),
			    [text(l.name)])]));
    }
    var from= g.current>0 
	? "a copy of "+concname(g.concretes[g.current-1].langcode)
	:"scratch";
    file.appendChild(p(text("You are about to create a new concrete syntax by starting from "+from+".")));
    file.appendChild(p(text("Pick a language for the new concrete syntax:")));
    file.appendChild(node("ul",{"class":"languages"},list));
}

function new_concrete(code) {
    return { langcode:code,params:[],lincats:[],opers:[],lins:[] };
}

function adjust_opens(cnc,oldcode,code) {
    for(var oi in cnc.opens)
	for(var li in rgl_modules)
	    if(cnc.opens[oi]==rgl_modules[li]+oldcode)
		cnc.opens[oi]=rgl_modules[li]+code;
}

function add_concrete2(ix,code) {
    var g=local.get(ix);
    var cs=g.concretes;
    var ci;
    for(var ci=0;ci<cs.length;ci++) if(cs[ci].langcode==code) break;
    if(ci==cs.length) {
	if(g.current>0) {
	    cs.push(cs[g.current-1]); // old and new are shared at this point
	    save_grammar(g); // serialization loses sharing
	    g=local.get(ix); // old and new are separate now
	    var oldcode=cs[g.current-1].langcode;
	    var cnc=g.concretes[ci];
	    cnc.langcode=code;
	    adjust_opens(cnc,oldcode,code);
	    timestamp(cnc)
	}
	else
	    cs.push(new_concrete(code))
	save_grammar(g);
    }
    open_concrete(g,ci);
}

function open_abstract(g) { g.current=0; reload_grammar(g); }
function open_concrete(g,i) { g.current=i+1; reload_grammar(g); }

function td_gap(c) {return wrap_class("td","gap",c); }
function gap() { return td_gap(text(" ")); }

function tab(active,link) {
    return  wrap_class("td",active ? "active" : "inactive",link);
}

function delete_concrete(g,ci) {
    var c=g.concretes[ci];
    var ok=c.params.length==0 && c.lincats.length==0 && c.opers.length==0
	   && c.lins.length==0
	|| confirm("Do you really want to delete the concrete syntax for "+
		   concname(c.langcode)+"?");
    if(ok) {
	g.concretes=delete_ix(g.concretes,ci)
	if(g.current && g.current-1>=ci) g.current--;
	reload_grammar(g);
    }
}

function draw_filebar(g) {
    var cur=(g.current||0)-1;
    var filebar = empty_class("tr","extensible")
    filebar.appendChild(gap());
    filebar.appendChild(
	tab(cur== -1,button("Abstract",function(){open_abstract(g);})));
    var cs=g.concretes;
    function del(ci) { return function() { delete_concrete(g,ci); }}
    function open_conc(i) { return function() {open_concrete(g,1*i); }}
    for(var i in cs) {
	filebar.appendChild(gap());
	filebar.appendChild(
	    tab(i==cur,deletable(del(i),button(concname(cs[i].langcode),open_conc(i)),"Delete this concrete syntax")));
    }
    filebar.appendChild(td_gap(more(g,add_concrete,"Add a concrete syntax")));
    return wrap_class("table","tabs",filebar);
}

function draw_file(g) {
    return g.current>0 // && g.current<=g.concretes.length
	? draw_concrete(g,g.current-1)
	: draw_abstract(g);
}

function draw_startcat(g) {
    var abs=g.abstract;
    var startcat = abs.startcat || abs.cats[0];
    function opt(cat) { return option(cat,cat); }
    var m= node("select",{},map(opt,abs.cats));
    m.value=startcat;
    m.onchange=function() { 
	if(m.value!=abs.startcat) {
	    abs.startcat=m.value;
	    timestamp(abs);
	    save_grammar(g); 
	}
    }
    return indent([kw("flags startcat"),sep(" = "),m]);
}

function draw_extends(exts) {
    var kw_extends=kw("extends ")
    kw_extends.title="This grammar is an extension of the grammars listed here."
    return exts && exts.length>0
	? indent([kw_extends,ident(exts.join(", "))])
	: text("")
}

function draw_abstract(g) {
    var kw_cat = kw("cat");
    kw_cat.title = "The categories (nonterminals) of the grammar are enumerated here. [C.3.2]";
    var kw_fun = kw("fun");
    kw_fun.title = "The functions (productions) of the grammar are enumerated here. [C.3.4]";
    var flags=g.abstract.startcat || g.abstract.cats.length>1
	? draw_startcat(g)
	: text("");
    function sort_funs() {
	g.abstract.funs=sort_list(this,g.abstract.funs,"name");
	timestamp(g.abstract);
	save_grammar(g);
    }
    return div_id("file",
		  [kw("abstract "),ident(g.basename),sep(" = "),
		   draw_timestamp(g.abstract),
		   draw_extends(g.extends),
		   flags,
		   indent([extensible([kw_cat,
				       indent(draw_cats(g))]),
			   extensible([kw_fun,
				       indent_sortable(draw_funs(g),sort_funs)])])]);
}

function add_cat(g,el) {
    function add(s) {
	var cats=s.split(/\s*(?:\s|[;])\s*/); // allow separating spaces or ";"
	if(cats.length>0 && cats[cats.length-1]=="") cats.pop();
	for(var i in cats) {
	    var err=check_name(cats[i],"Category");
	    if(err) return err;
	}
	for(var i in cats) g.abstract.cats.push(cats[i]);
	timestamp(g.abstract);
	reload_grammar(g);
	return null;
    }
    string_editor(el,"",add);
}

function delete_cat(g,ix) {
    with(g.abstract) cats=delete_ix(cats,ix);
    timestamp(g.abstract);
    reload_grammar(g);
}

function rename_cat(g,el,cat) {
    function ren(newcat) {
	if(newcat!="" && newcat!=cat) {
	    var err=check_name(newcat,"Category");
	    if(err) return err;
	    var dc=defined_cats(g);
	    if(dc[newcat]) return newcat+" is already in use";
	    g=rename_category(g,cat,newcat);
	    timestamp(g.abstract);
	    reload_grammar(g);
	}
	return null;
    }
    string_editor(el,cat,ren);
}

function duplicated(g,kind,orig) {
    return orig==g.basename
	? "Same "+kind+" defined twice in this module"
	: "Same "+kind+" already defined in "+orig
}

function draw_cats(g) {
    var cs=g.abstract.cats;
    var es=[];
    var defined=inherited_cats(g);
    function eident(cat) {
	function ren(g,el) { rename_cat(g,el,cat); }
	return editable("span",ident(cat),g,ren,"Rename category");
    }
    function check(cat,el) {
	return ifError(defined[cat],duplicated(g,"category",defined[cat]),el);
    }
    function del(i) { return function() { delete_cat(g,i); }}
    for(var i in cs) {
	es.push(deletable(del(i),check(cs[i],eident(cs[i])),"Delete this category"));
	defined[cs[i]]=g.basename;
	es.push(sep("; "));
    }
    es.push(more(g,add_cat,"Add more categories"));
    return es;
}

function add_fun(g,el) {
    function add(s) {
	var p=parse_fun(s);
	if(p.ok) {
	    g.abstract.funs.push(p.ok);
	    timestamp(g.abstract);
	    reload_grammar(g);
	    return null;
	}
	else
	    return p.error
    }
    string_editor(el,"",add);
}

function edit_fun(i) {
    return function (g,el) {
	function replace(s) {
	    var p=parse_fun(s);
	    if(p.ok) {
		var old=g.abstract.funs[i];
		g.abstract.funs[i]=p.ok;
		if(p.ok.name!=old.name) g=rename_function(g,old.name,p.ok.name);
		if(show_type(p.ok.type)!=show_type(old.type))
		    g=change_lin_lhs(g,p.ok);
		timestamp(g.abstract);
		reload_grammar(g);
		return null;
	    }
	    else
		return p.error;
	}
	string_editor(el,show_fun(g.abstract.funs[i]),replace);
    }
}

function delete_fun(g,ix) {
    with(g.abstract) funs=delete_ix(funs,ix);
    timestamp(g.abstract);
    reload_grammar(g);
}

function draw_funs(g) {
    var funs=g.abstract.funs;
    var es=[];
    var dc=defined_cats(g);
    var df=inherited_funs(g);
    function del(i) { return function() { delete_fun(g,i); }}
    function draw_efun(i,df) {
	return editable("span",draw_fun(g,funs[i],dc,df),g,edit_fun(i),"Edit this function");
    }
    for(var i in funs) {
	es.push(node_sortable("fun",funs[i].name,[deletable(del(i),draw_efun(i,df),"Delete this function")]));
	df[funs[i].name]=g.basename;
    }
    es.push(more(g,add_fun,"Add a new function"));
    return es;
}

function draw_fun(g,fun,dc,df) {
    function check(el) {
	return ifError(dc[fun.name],
		       "Function names must be distinct from category names",
		       ifError(df[fun.name],duplicated(g,"function",df[fun.name]),el));
    }
    return node("span",{},
		[check(ident(fun.name)),sep(" : "),draw_type(fun.type,dc)]);
}

function draw_type(t,dc) {
    var el=empty("span");
    function check(t,el) {
	return ifError(!dc[t],"Undefined category",el);
    }
    for(var i in t) {
	if(i>0) el.appendChild(sep(" → "));
	el.appendChild(check(t[i],ident(t[i])));
    }
    return el;
}

function edit_name(g,el) {
    function change_name(name) {
	if(name!=g.basename && name!="") {
	    var err=check_name(name,"Grammar");
	    if(err) return err;
	    g.basename=name
	    reload_grammar(g);
	}
	return null;
    }
    string_editor(el,g.basename,change_name)
}
/* -------------------------------------------------------------------------- */

function draw_concrete(g,i) {
    var conc=g.concretes[i];
    function edit_langcode(g,el) {
	function change_langcode(code) {
	    var err=check_name(g.basename+code,"Name of concrete syntax");
	    if(err) return err;
	    adjust_opens(conc,conc.langcode,code);
	    conc.langcode=code;
	    timestamp(conc);
	    reload_grammar(g);
	}
	string_editor(el,conc.langcode,change_langcode)
    }
    var kw_lincat=kw("lincat")
    kw_lincat.title="The linearization type for each catagory in the abstract syntax is given here. [C.3.8]"
    var kw_lin=kw("lin")
    kw_lin.title="The linearization function for each function in the abstract syntax is given here. [C.3.9]"
    var kw_param=kw("param")
    kw_param.title="Parameter type definitions can be added here. [C.3.12]"
    var kw_oper=kw("oper")
    kw_oper.title="Operation definitions can be added here. [C.3.14]"
    return div_id("file",
		  [kw("concrete "),
		   ident(g.basename),
		   editable("span",ident(conc.langcode),g,
			    edit_langcode,"Change language"),
		   kw(" of "),ident(g.basename),sep(" = "),
		   draw_timestamp(conc),
		   draw_extends((g.extends || []).map(conc_extends(conc))),
		   indent([extensible([kw("open "),draw_opens(g,i)])]),
		   indent([kw_lincat,draw_lincats(g,i)]),
		   indent([kw_lin,draw_lins(g,i)]),
		   indent([extensible([kw_param,draw_params(g,i)])]),
		   indent([extensible([kw_oper,draw_opers(g,i)])]),
		   exb_extra(g,i)
		  ])
}

var rgl_modules=["Paradigms","Syntax","Lexicon","Extra"];

function add_open(ci) {
    return function (g,el) {
	var conc=g.concretes[ci];
	var os=conc.opens;
	var ds={};
	for(var i in os) ds[os[i]]=true;
	var list=[]
	for(var i in rgl_modules) {
	    var b=rgl_modules[i], m=b+conc.langcode;
	    if(!ds[m])
		list.push(li([a(jsurl("add_open2("+g.index+","+ci+",'"+m+"')"),
				[text(m)])]));
	}
	if(list.length>0) {
	    var file=element("file");
	    file.innerHTML="";
	    file.appendChild(p(text("Pick a resource library module to open:")));
	    file.appendChild(node("ul",{},list));
	}
    }
}

function add_open2(ix,ci,m) {
    var g=local.get(ix);
    var conc=g.concretes[ci];
    conc.opens || (conc.opens=[]);
    conc.opens.push(m);
    timestamp(conc);
    save_grammar(g);
    open_concrete(g,ci);
}

function delete_open(g,ci,ix) {
    with(g.concretes[ci]) opens=delete_ix(opens,ix);
    timestamp(g.concretes[ci]);
    reload_grammar(g);
}

function draw_opens(g,ci) {
    var conc=g.concretes[ci];
    var os=conc.opens || [] ;
    var es=[];
    function del(i) { return function() { delete_open(g,ci,i); }}
    var first=true;
    for(var i in os) {
	if(!first) es.push(sep(", "))
	es.push(deletable(del(i),ident(os[i]),"Don't open this module"));
	first=false;
    }
    es.push(more(g,add_open(ci),"Open more modules"));
    return indent(es);
}

function draw_param(p,dp) {
    function check(el) {
	return ifError(dp[p.name],"Same parameter type defined twice",el);
    }
    return node("span",{},[check(ident(p.name)),sep(" = "),text(p.rhs)]);
}

function add_param(g,ci,el) {
    function add(s) {
	var p=parse_param(s);
	if(p.ok) {
	    g.concretes[ci].params.push(p.ok);
	    timestamp(g.concretes[ci]);
	    reload_grammar(g);
	    return null;
	}
	else
	    return p.error
    }
    string_editor(el,"",add);
}

function edit_param(ci,i) {
    return function (g,el) {
	function replace(s) {
	    var p=parse_param(s);
	    if(p.ok) {
		g.concretes[ci].params[i]=p.ok;
		timestamp(g.concretes[ci]);
		reload_grammar(g);
		return null;
	    }
	    else
		return p.error;
	}
	string_editor(el,show_param(g.concretes[ci].params[i]),replace);
    }
}


function delete_param(g,ci,ix) {
    with(g.concretes[ci]) params=delete_ix(params,ix);
    timestamp(g.concretes[ci]);
    reload_grammar(g);
}

function draw_params(g,ci) {
    var conc=g.concretes[ci];
    conc.params || (conc.params=[]);
    var params=conc.params;
    var es=[];
    var dp={};
    function del(i) { return function() { delete_param(g,ci,i); }}
    function draw_eparam(i,dp) {
	return editable("span",draw_param(params[i],dp),g,edit_param(ci,i),"Edit this parameter type");
    }
    for(var i in params) {
	es.push(div_class("param",[deletable(del(i),draw_eparam(i,dp),"Delete this parameter type")]));
	dp[params[i].name]=true;
    }
    es.push(more(g,function(g,el) { return add_param(g,ci,el)},
		 "Add a new parameter type"));
    return indent(es);
}

function delete_lincat(g,ci,cat) {
    var i;
    var c=g.concretes[ci];
    for(i=0;i<c.lincats.length && c.lincats[i].cat!=cat;i++);
    if(i<c.lincats.length) c.lincats=delete_ix(c.lincats,i);
    timestamp(c);
    reload_grammar(g);
}

function draw_lincats(g,i) {
    var conc=g.concretes[i];
    function edit(c) {
	return function(g,el) {
	    function check(s,cont) {
		function check2(msg) {
		    if(!msg) {
			if(c.template) conc.lincats.push({cat:c.cat,type:s});
			else c.type=s;
			reload_grammar(g);
		    }
		    cont(msg);
		}
		check_exp(s,check2);
	    }
	    string_editor(el,c.type,check,true)
	}
    }
    function del(c) { return function() { delete_lincat(g,i,c); } }
    function dlc(c,cls) {
	var t=editable("span",text_ne(c.type),g,edit(c),"Edit lincat for "+c.cat);
	return node("span",{"class":cls},
		    [ident(c.cat),sep(" = "),t]);
    }
    var dc=locally_defined_cats(g,{});
    function draw_lincat(c) {
	var cat=c.cat;
	var err=!dc[cat];
	var l1=dlc(c,"lincat");
	var l2= deletable(del(cat),l1,"Delete this lincat");
	var l=ifError(err,"lincat for undefined category",l2);
	delete dc[cat];
	return node_sortable("lincat",cat,[l]);
    }
    function dtmpl(c) {	
	return wrap("div",dlc({cat:c,type:"",template:true},"template")); }
    var lcs=map(draw_lincat,conc.lincats);
    for(var c in dc)
	lcs.push(dtmpl(c));
    function sort_lincats() {
	conc.lincats=sort_list(this,conc.lincats,"cat");
	timestamp(conc);
	save_grammar(g);
    }
    return indent_sortable(lcs,sort_lincats);
}

/* -------------------------------------------------------------------------- */

function draw_oper(p,dp) {
    function check(el) {
	return ifError(dp[p.name],"Same operator definition defined twice",el);
    }
    return node("span",{},[check(ident(p.name)),text(" "),text(p.rhs)]);
}

function check_oper(s,ok,err) {
    var p=parse_oper(s);
    function check2(msg) {
	if(msg) err(msg);
	else ok(p.ok)
    }
    if(p.ok) {
	// Checking oper syntax by checking an expression with a local
	// definition. Some valid opers will be rejected!!
	var e=p.ok.name+" where { "+p.ok.name+" "+p.ok.rhs+" }";
	check_exp(e,check2);
    }
    else
	err(p.error);
}

function add_oper(g,ci,el) {
    function check(s,cont) {
	function ok(oper) {
	    g.concretes[ci].opers.push(oper);
	    timestamp(g.concretes[ci]);
	    reload_grammar(g);
	    cont(null);
	}
	check_oper(s,ok,cont)
    }
    string_editor(el,"",check,true);
}

function edit_oper(ci,i) {
    return function (g,el) {
	function check(s,cont) {
	    function ok(oper) {
		g.concretes[ci].opers[i]=oper;
		timestamp(g.concretes[ci]);
		reload_grammar(g);
		cont(null);
	    }
	    check_oper(s,ok,cont)
	}
	string_editor(el,show_oper(g.concretes[ci].opers[i]),check,true);
    }
}

function delete_oper(g,ci,ix) {
    with(g.concretes[ci]) opers=delete_ix(opers,ix);
    timestamp(g.concretes[ci]);
    reload_grammar(g);
}

function draw_opers(g,ci) {
    var conc=g.concretes[ci];
    conc.opers || (conc.opers=[]);
    var opers=conc.opers;
    var es=[];
    var dp={};
    function del(i) { return function() { delete_oper(g,ci,i); }}
    function draw_eoper(i,dp) {
	return editable("span",draw_oper(opers[i],dp),g,edit_oper(ci,i),"Edit this operator definition");
    }
    for(var i in opers) {
	es.push(node_sortable("oper",opers[i].name,
			      [deletable(del(i),draw_eoper(i,dp),
					 "Delete this operator definition")]));
	dp[opers[i].name]=true;
    }
    es.push(more(g,function(g,el) { return add_oper(g,ci,el)},
		 "Add a new operator definition"));
    function sort_opers() {
	conc.opers=sort_list(this,conc.opers,"name");
	timestamp(conc);
	save_grammar(g);
    }
    return indent_sortable(es,sort_opers);
}

function delete_lin(g,ci,fun) {
    var i;
    var c=g.concretes[ci];
    for(i=0;i<c.lins.length && c.lins[i].fun!=fun;i++);
    if(i<c.lins.length) c.lins=delete_ix(c.lins,i);
    timestamp(c);
    reload_grammar(g);
}

/* -------------------------------------------------------------------------- */
function arg_names(type) {
    function lower(s) { return s.toLowerCase(); }
    var names=map(lower,type);
    names.pop(); // remove result type
    var n,count={},use={};
    for(var i in names) n=names[i],count[n]=0,use[n]=0;
    for(var i in names) count[names[i]]++;
    function unique(n) {
	return count[n]>1 ? n+(++use[n]) : n;
    }
    return map(unique,names);
}

function draw_lins(g,ci) {
    var conc=g.concretes[ci];
    function edit(f) {
	return function(g,el) {
	    function check(s,cont) {
		function check2(msg) {
		    if(!msg) {
			if(f.template)
			    conc.lins.push({fun:f.fun,args:f.args,lin:s});
			else { f.lin=s; f.eb_lin=null; }
			reload_grammar(g);
		    }
		    cont(msg);
		}
		check_exp(s,check2);
	    }
	    string_editor(el,f.lin,check,true)
	}
    }
    function del(fun) { return function () { delete_lin(g,ci,fun); } }
    function dl(f,cls) {
	var l=[ident(f.fun)]
	for(var i in f.args) {
	    l.push(text(" "));
	    l.push(ident(f.args[i]));
	}
	l.push(sep(" = "));
	var t=editable("span",text_ne(f.lin),g,edit(f),"Edit lin for "+f.fun);
	appendChildren(t,exb_linbuttons(g,ci,f));
	l.push(t);
	return node("span",{"class":cls},l);
    }
    var df=locally_defined_funs(g,{});
    function draw_lin(f) {
	var fun=f.fun;
	var err= !df[fun];
	var l= deletable(del(fun),dl(f,"lin"),"Delete this linearization function")
	var l=ifError(err,"Function "+fun+" is not part of the abstract syntax",l);
	delete df[fun];
	return node_sortable("lin",fun,[l]);
    }
    function largs(f) {
	var funs=g.abstract.funs;
	for(var i=0;i<funs.length && funs[i].name!=f;i++);
	return arg_names(funs[i].type);
    }
    function dtmpl(f) {	
	return div_class("template",
			 [dl({fun:f,args:largs(f),lin:"",template:true},"template")]);
    }
    function sort_lins() {
	conc.lins=sort_list(this,conc.lins,"fun");
	timestamp(conc);
	save_grammar(g);
    }
    var ls=map(draw_lin,conc.lins);
    for(var f in df)
	ls.push(dtmpl(f));
    return indent_sortable(ls,sort_lins);
}

/* -------------------------------------------------------------------------- */

function defined_cats(g) {
    var grammar_byname=cached_grammar_byname();
    var igs=(g.extends || []).map(grammar_byname)
    return all_defined_cats(g,igs)
}

function inherited_cats(g) {
    var grammar_byname=cached_grammar_byname();
    var igs=(g.extends || []).map(grammar_byname)
    return all_inherited_cats(igs,{})
}

function defined_funs(g) {
    var grammar_byname=cached_grammar_byname();
    var igs=(g.extends || []).map(grammar_byname)
    return all_defined_funs(g,igs)
}

function inherited_funs(g) {
    var grammar_byname=cached_grammar_byname();
    var igs=(g.extends || []).map(grammar_byname)
    return all_inherited_funs(igs,{})
}

function cached_grammar_byname() {
    var gix={};
    for(var i=0;i<local.count;i++) {
	var g=local.get(i,null);
	if(g) gix[g.basename]=g; // basenames are not necessarily unique!!
    }
    function grammar_byname(name) { return gix[name]; }
    return grammar_byname;
}

/* -------------------------------------------------------------------------- */

function find_langcode(concs,langcode) {
    for(var ci in concs)
	if(concs[ci].langcode==langcode)
	    return concs[ci];
    return null;
}

function cleanup_deleted(files) {
    var keep={}
    for(var i in files) keep[files[i]]=true;
    //debug("cleanup_deleted "+JSON.stringify(files))
    //debug("keep "+JSON.stringify(keep))
    for(var i=0;i<local.count;i++) {
	var g=local.get(i,null)
	if(g && g.unique_name && !keep[g.unique_name+".json"]) {
	    debug("cleanup "+i+" "+g.unique_name);
	    remove_local_grammar(i)
	}
    }
}

function grammar_index() {
    var index={}
    var count=local.count
    for(var i=0;i<count;i++) {
	var g=local.get(i,null)
	if(g && g.unique_name) index[g.unique_name]=i
    }
    return index
}

function merge_grammar(i,newg) {
    var oldg=local.get(i);
    var keep="";
    debug("Merging at "+i);
    if(oldg) {
	oldg.basename=newg.basename;
	if(newg.abstract.timestamp<oldg.abstract.timestamp) {
	    newg.abstract=newg.abstract
	    keep+=" "+oldg.basename
	}
	for(var ci in newg.concretes) {
	    var conc=newg.concretes[ci];
	    var oldconc=find_langcode(oldg.concretes,conc.langcode);
	    if(oldconc && conc.timestamp<oldconc.timestamp) {
		newg.concretes[ci]=oldconc;
		keep+=" "+oldg.basename+conc.langcode;
	    }
	}
    }
    local.put(i,newg)
    return keep;
}

function timestamp(obj,prop) {
    obj[prop || "timestamp"]=Date.now();
}

function draw_timestamp(obj) {
    var t=obj.timestamp;
    return node("small",{"class":"modtime"},
		[text(t ? " -- "+new Date(t).toLocaleString() : "")]);
}

/* -------------------------------------------------------------------------- */

function delete_ix(old,ix) {
    var a=[];
    for(var i in old) if(i!=ix) a.push(old[i]);
    return a;
}

function sort_list(list,olditems,key) {
    var items=[];
    function find(fun) {
	for(var i=0;i<olditems.length;i++)
	    if(olditems[i][key]==fun) return olditems[i];
	return null;
    }
    for(var el=list.firstChild;el;el=el.nextSibling) {
	var name=el.getAttribute("ident")
	if(name) {
	    var old=find(name);
	    if(old) items.push(old)
	    else debug("Bug: did not find "+name+" while sorting");
	}
    }
    if(items.length==olditems.length)
	return items;
    else {
	debug("Bug: length changed while sorting")
	return olditems;
    }
}

function string_editor(el,init,ok,async) {
    var p=el.parentNode;
    function restore() {
	e.parentNode.removeChild(e);
	el.style.display="";
    }
    function done() {
	var edited=e.it.value;
	restore();
	function cont(msg) { if(msg) start(msg); }
	if(async) ok(edited,cont)
	else cont(ok(edited));
	return false;
    }
    function start(msg) {
	el.style.display="none";
	m.innerHTML=msg;
	insertAfter(e,el);
	e.it.focus();
    }
    var m=empty_class("span","error_message");
    var i=node("input",{"class":"string_edit",name:"it",value:init},[]);
    if(init.length>10) i.size=init.length+5;
//  var i=node("textarea",{name:"it",rows:"2",cols:"60"},[text(init)]);
    var e=node("form",{},
	       [i,
		node("input",{type:"submit",value:"OK"},[]),
		button("Cancel",restore),
		text(" "),
		m])
    e.onsubmit=done
    start("");
}

function ifError(b,msg,el) { return b ? inError(msg,el) : el; }

function inError(msg,el) {
    return node("span",{"class":"inError",title:msg},[el]);
}

function kw(txt) { return wrap_class("span","kw",text(txt)); }
function sep(txt) { return wrap_class("span","sep",text(txt)); }
function ident(txt) { return wrap_class("span","ident",text(txt)); }
function unimportant(txt) { return wrap_class("small","unimportant",text(txt)); }
function indent(cs) { return div_class("indent",cs); }

function indent_sortable(cs,sort) {
    var n= indent(cs);
    n.onsort=sort;
    return n;
}

function node_sortable(cls,name,ls) {
    return node("div",{"class":cls,"ident":name},ls);
}

function extensible(cs) { return div_class("extensible",cs); }

function more(g,action,hint) {
    var b=node("span",{"class":"more","title":hint || "Add more"},
	       [text(" + ")]);
    b.onclick=function() { action(g,b); }
    return b;
}

function text_ne(s) { // like text(s), but force it to be non-empty
    return text(s ? s : "\xa0\xa0\xa0")
}

function editable(tag,cs,g,f,hint) {
    var b=edit_button(function(){f(g,e)},hint);
    var e=node(tag,{"class":"editable"},[cs,b]);
    //e.onclick=b.onclick;
    return e;
}

function edit_button(action,hint) {
    var b=node("span",{"class":"edit","title":hint || "Edit"},[text("%")]);
    b.onclick=action;
    return b;
}

function deletable(del,el,hint) {
    var b=delete_button(del,hint)
    return node("span",{"class":"deletable"},[b,el])
}

function delete_button(action,hint) {
    var b=node("span",{"class":"delete",title:hint || "Delete"},[text("×")])
    b.onclick=action;
    return b;
}

function touch_edit() {
    var b=node("input",{type:"checkbox"},[]);
    function touch() {
	document.body.className=b.checked ? "nohover" : "hover";
    }
    b.onchange=touch;
    insertAfter(b,editor);
    insertAfter(wrap("small",text("Enable editing on touch devices. ")),b);
}
/* --- DOM Support ---------------------------------------------------------- */

function div_id(id,cs) { return node("div",{id:id},cs); }
function div_class(cls,cs) { return node("div",{"class":cls},cs); }
function a(url,linked) { return node("a",{href:url},linked); }
function ul(lis) { return node("ul",{},lis); }
function li(xs) { return node("li",{},xs); }
function table(rows) { return node("table",{},rows); }
function td_right(cs) { return node("td",{"class":"right"},cs); }
function jsurl(js) { return "javascript:"+js; }

function hidden(name,value) {
    return node("input",{type:"hidden",name:name,value:value},[])
}

function insertBefore(el,ref) { ref.parentNode.insertBefore(el,ref); }

function insertAfter(el,ref) {
    ref.parentNode.insertBefore(el,ref.nextSibling);
}
/* -------------------------------------------------------------------------- */

function download_from_cloud() {
    var newdir="/tmp/"+location.hash.substr(1)

    function download2(olddir) {
	//debug("Starting grammar sharing in the cloud")
	if(newdir!=olddir) link_directories(newdir,download3)
	else download4()
    }
    function download3() {
	//debug("Uploading local grammars to cloud");
	local.put("dir",newdir);
	upload_json(download4)
    }
    function download4() {
	//debug("Downloading grammars from the cloud");
	download_json()
    }

    with_dir(download2)
}

/* --- Initialization ------------------------------------------------------- */

//document.body.appendChild(empty_id("div","debug"));

function dir_bugfix() {
    // remove trailing newline caused by bug in older version
    var dir=local.get("dir");
    if(dir) {
	var n=dir.length;
	while(dir[dir.length-1]=="\n" || dir[dir.length-1]=="\r")
	    dir=dir.substr(0,dir.length-1)
	if(dir.length<n) {
	    debug("removing trailing newline")
	    local.put("dir",dir);
	}
	//debug("Server directory: "+JSON.stringify(dir))
    }
    else debug("No server directory yet")
}

if(editor) {
    initial_view();
    touch_edit();
    dir_bugfix();
}

//console.log("hi")
