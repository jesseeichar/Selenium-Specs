/*
 * Format for Selenium Remote Control Scala client.
 */

var subScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);
subScriptLoader.loadSubScript('chrome://selenium-ide/content/formats/remoteControl.js', this);

this.startsWith = function (s,e) {
    return (s.match("^\\s*" + e));
};

this.trim = function (s) {
    return (s.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, ""));
};

this.name = "scala-specs2";

/**
 * A class for processing commands
 */
function CommandProcessor() {
    // contain the spec functions to add after spec definition
    this.functions = [];
    // the specification declarations
    this.specs=[];
    // Since there is not good way to create a function name we will
    // reuse the same name with an index
    this.functionIndex = 1;
    // if defined then the current function being constructed
    this.currentFunction = undefined;
    // the type of the last command processed.
    // Types are:
    //   undefined (initial state),
    //   spec
    //   assert
    //   other
    this.lastCommand = undefined;

    // If defined the spec comment under construction
    this.specDec = undefined;

    this.endFunction = function () {
        if (this.currentFunction !== undefined) {
            if (this.lastCommand !== 'assert') {
                this.currentFunction += indents(2) + "success\n";
            }
            this.currentFunction += indents(1) + "}";
            this.functions.push(this.currentFunction);
            this.currentFunction = undefined;
        }
    };

    this.repeat = function (c, n) {
        var str = "";
        for (var i = 0; i < n; i++) {
            str += c;
        }
        return str;
    };

    this.handleSpecDeclaration = function (code) {
        var spec,spaces;

        if (this.lastCommand === 'spec') {
            this.specs.push(this.specDec);
        }

        this.lastCommand = 'spec';
        // this is a spec comment
        spec = indents(2) + '"' + trim(code.substr(1)) + '"';
        spaces = options.rightColumnIndent - spec.length;
        this.specDec = spec + this.repeat(" ", spaces);
    }

    this.processCommand = function (command, code) {
        var methodName;

        if (this.lastCommand === undefined && !startsWith(code, "//-")) {
            this.handleSpecDeclaration("- "+options.initialSpec);
        }

        if (this.specDec !== undefined) {
            methodName = name.replace(/ |\+|-|\|/g, '_') + "_" + this.functionIndex;
            this.functionIndex += 1;
            this.specDec += "! " + methodName;

            if (command.command.match(/^(verify|assert)/)) {
                this.lastCommand = 'assert';
            } else {
                this.lastCommand = 'other';
            }

            this.currentFunction =
                indents(1) + "def " + methodName + " = {\n"+
                indents(2) + "import selenium._\n" +
                indents(2) + code + "\n";

            this.specs.push(this.specDec);
            this.specDec = undefined;
        } else {
            
            this.currentFunction += indents(2) + code + "\n";
        }
    };

    this.output = function () {
	    if (this.currentFunction !== undefined) {
    	    this.endFunction();
    	}

        var closeStep = ""
        return this.specs.join("^\n") + closeStep + "\n\n" + this.functions.join("\n\n");
    };
}
this.formatCommands = function (commands) {
    var processor = new CommandProcessor();
    commands = filterForRemoteControl(commands);
	if (this.lastIndent == null) {
		this.lastIndent = '';
	}
	for (var i = 0; i < commands.length; i++) {
		var line = null;
		var command = commands[i];
		if (command.type == 'line') {
			line = command.line;
		} else if (command.type == 'command') {
			line = formatCommand(command);
			if (line != null) line = addIndent(line);
			command.line = line;
		} else if (command.type == 'comment') {
		    if(startsWith(command.comment, '-')) {
		        processor.endFunction();
                processor.handleSpecDeclaration(command.comment);
	        } else {
	            line = this.formatComment(command);
    			if (line != null) {
    			    line = addIndent(line);    			    
			    }
            }

			command.line = line;
		}
		command.charIndex = this.commandCharIndex;
		if (line != null) {
			updateIndent(line);
            processor.processCommand(command, line);
			this.commandCharIndex += line.length;
		}
	}
	
	result = processor.output();
	
	return result;
}

function formatComment(comment) {
    return comment.comment.replace(/.+/mg, function(str) {
            return "// " + str;
        });
}
function useSeparateEqualsForArray() {
    return false;
}

function testMethodName(testName) {
    return capitalize(testName).replace(/ /g,"_");
}

function assertTrue(expression) {
    return expression.toString()+" must beTrue";
}

function verifyTrue(expression) {return assertTrue(expression);}

function assertFalse(expression) {
    return expression.toString() + "must beFalse";
}

function verifyFalse(expression) {return assertFalse(expression);}

function assignToVariable(type, variable, expression) {
    return "val " + variable + " = " + expression.toString();
}

function ifCondition(expression, callback) {
    return "if (" + expression.toString() + ") {\n" + callback() + "}";
}

function joinExpression(expression) {
    return expression.toString() + ".mkString(',')";
}

function waitFor(expression) {
    return "doWait("+expression.toString()+")";
}

function assertOrVerifyFailure(line, isAssert) {
  return "throwA[Throwable] {"+line+"}";
}

Equals.prototype.toString = function() {
        return this.e1.toString() + " == " + this.e2.toString();
};

Equals.prototype.assert = function() {
    return  this.e1.toString() + " must_== " + this.e2.toString();
};

Equals.prototype.verify = function() {
    return  this.e1.toString() + " must_== " + this.e2.toString();
};
NotEquals.prototype.toString = function() {
    return this.e1.toString() + " != " + this.e2.toString() ;
};

NotEquals.prototype.assert = function() {
    return this.e1.toString() + " must_!= " + this.e2.toString();
};

NotEquals.prototype.verify = NotEquals.assert

RegexpMatch.prototype.toString = function() {
  return this.expression + ".matches (\"\"\"" + this.pattern + "\"\"\")";
};
RegexpMatch.prototype.verify = function() {
	return this.expression + " must =~ (\"\"\"" + this.pattern + "\"\"\")";
};
function pause(milliseconds) {
    return "sleep(" + parseInt(milliseconds, 10) + ")";
}

function echo(message) {
    return "println(" + xlateArgument(message) + ")";
}

function statement(expression) {
    return expression.toString();
}

function array(value) {
    var str = 'Array(';
    var i = 0;
    for (i = 0; i < value.length; i++) {
        str += string(value[i]);
        if (i < value.length - 1) {
          str += ", ";
        }
    }
    str += ')';
    return str;
}

function nonBreakingSpace() {
    return "\"\\u00a0\"";
}

CallSelenium.prototype.toString = function() {
    var result = '';
    var i = 0;
    if (this.negative) {
        result += '!';
    }
    if(this.message === 'type') {
        result += "`" + this.message + "`";
    } else {
        result += this.message
    }
    result += '(';
    for (i = 0; i < this.args.length; i++) {
        result += this.args[i];
        if (i < this.args.length - 1) {
            result += ', ';
        }
    }
    result += ')';
    
    return result;
};

/**
 * Returns a string representing the suite for this formatter language.
 *
 * @param testSuite  the suite to format
 * @param filename   the file the formatted suite will be saved as
 */
function formatSuite(testSuite, filename) {
    var suiteClass = /^(\w+)/.exec(filename)[1];
    suiteClass = suiteClass[0].toUpperCase() + suiteClass.substring(1);
    
    var formattedSuite = "package "+options.packageName+"\n"
        + "\n"
        + "import org.specs2._\n"
        + "\n"
        + "class " + suiteClass + " extends SpecificationsFinder {def is=\n"
        + "\n"
        + indents(1) + "specs.foldLeft(\""+testSuite.tests[i].getTitle()+"\".title) {\n"
        + indents(2) + "(res,cur) => res ^ link(cur)\n"
        + indents(1) + "}\n"
        + "\n"
        + indents(1) + "def specs = List(\n";
    var i = 0;
    var testClass;
    for (i = 0; i < testSuite.tests.length; ++i) {
        testClass = testSuite.tests[i].getTitle();
        formattedSuite += indents(2) + "classOf[" + testClass + "]";
        if(i+1 < testSuite.tests.length) {
            formattedSuite += ",";
        }
        formattedSuite += "\n";
    }
    
    formattedSuite += indents(1) + ")\n"
        + "}\n"
        + "\n"
        + "object "+suiteClass+" {\n"
        + "\n"
        + indents(1) + "def main(args:Array[String]) {\n"
        + indents(2) + "specs2.html.start(\"${packageName}."+suiteClass+"\")\n"
        + indents(1) + "}\n"
        + "}\n";

    return formattedSuite;
}

this.options = {
    receiver: "selenium",
    environment: "*chrome",
    packageName: "com.example.tests",
    indent: '2',
    initialIndents: '0',
    rightColumnIndent: 80,
    seleniumDriver: "org.openqa.selenium.firefox.FirefoxDriver",
    specSummary: "This specification tests",
    initialSpec: "The selenium script should succeed",
    timeout: "30"
};

options.header =
    "package c2c.webspecs\n" +
    "package geonetwork\n" +
    "package geocat\n" +
    "package spec\n" +
    "package ${packageName}\n" +
    "\n" +
    "import org.specs2._\n" +
    "import matcher.ThrownExpectations\n" +
    "import specification.Step\n" +
    "import Thread._\n" +
    "import org.openqa.selenium.WebDriverBackedSelenium\n" +
    "import org.junit.runner.RunWith\n" +
    "import org.specs2.runner.JUnitRunner\n" +
    "\n" +
    "@RunWith(classOf[JUnitRunner])\n" +
    "class `${className}` extends GeocatSeleniumSpecification with ThrownExpectations { \n" +
    "\n"+
    indents(1) + "def isImpl = \n" + 
    indents(1) + "\"${specSummary} ${className}\"    ^ \n";
    
options.footer =
    "\n\n"+
    indents(1) + "val TIMEOUT = " + options.timeout + "\n" +
    indents(1) + "private def doWait(assertion: => Boolean, waits:Int=TIMEOUT, length:Int=1000) = \n" +
    indents(2) + "(1 to waits).view map {_=> sleep(length)} find { _ => assertion }\n" +
    "\n}\n";

this.configForm = 
    '<description>Variable for Selenium instance</description>' +
    '<textbox id="options_receiver" />' +
    '<description>Environment</description>' +
    '<textbox id="options_environment" />' +
    '<description>Package</description>' +
    '<textbox id="options_packageName" />'+
    '<description>Specification Summary Text</description>' +
    '<textbox id="options_specSummary" />'+
    '<description>Default Specification Text</description>' +
    '<textbox id="options_initialSpec" />'+
    '<description>Selenium Driver</description>' +
    '<menulist id="options_seleniumDriver" >' +
    '<menupopup>' +
    '<menuitem label="Firefox" value="org.openqa.selenium.firefox.FirefoxDriver"/>' +
    '<menuitem label="Chrome" value="org.openqa.selenium.chrome.ChromeDriver"/>' +
    '<menuitem label="IE" value="org.openqa.selenium.ie.InternetExplorerDriver"/>' +
    '<menuitem label="HtmlUnit" value="org.openqa.selenium.htmlunit.HtmlUnitDriver"/>' +
    '</menupopup>' +
    '</menulist>' +
    '<description>Timeout in seconds</description>' +
    '<textbox id="options_timeout" />';