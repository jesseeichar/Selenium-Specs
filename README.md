This project contains a selenium IDE format that outputs the recorded selenium script in scala and more specifically for Specs2.  


Installation
------------

 * Install Firefox Selenium IDE plugins:  http://seleniumhq.org/download/
 * Select Tools > Selenium IDE menu item
 * Select Options > Options... menu item
 * Click Formats tab
 * Click Add button
 * Copy and paste contents of https://raw.github.com/jesseeichar/Selenium-Specs/master/seleniumScalaFormat.js into the text area of new dialog
 * Click Save (note: Depending on selenium version You may not see new format until you close the Options dialog and re-open it)


Running Tests
-------------

To run the exported tests you need to add the dependencies in https://github.com/jesseeichar/Selenium-Specs/blob/master/build.sbt

Fragment Formatting
-------------------

The output format uses comments to provide the output format with metadata on how to create the specs.  The current rules are:

  * If a comment starts with a - that line indicates the start of a new fragment

More rules will be added in the future for formatting etc...

Example Output
--------------

    package com.example.tests

		import org.specs2._
		import matcher.ThrownExpectations
		import specification.Step
		import Thread._
		import org.openqa.selenium.WebDriverBackedSelenium

		class `Google Search` extends Specification with ThrownExpectations { 

		  lazy val selenium = new WebDriverBackedSelenium(new org.openqa.selenium.firefox.FirefoxDriver(), "http://www.google.ch/")

		  def is = 
		  sequential                                                ^
		  "This specification tests Google Search"    ^ Step(() => selenium) ^ 
		    "Searching google.ch for toys should return a toys r us result"             ! scala_specs2_1^
		    "clicking the Bilder link should open the results for images search"        ! scala_specs2_2 ^
		                                                                                Step(selenium.stop()) ^
		                                                                                end


		  def scala_specs2_1 = {
		    import selenium._
		    open("/")
		    `type`("q", "toys")
		    click("btnG")
		    doWait(isTextPresent("Toys\"R\"Us"))
		    isTextPresent("Toys\"R\"Us") must beTrue
		    success
		  }

		  def scala_specs2_2 = {
		    import selenium._
		    click("css=a.q.qs")
		    waitForPageToLoad("30000")
		    isTextPresent("Verwandte Suchanfragen") must beTrue
		    success
		  }

		  val TIMEOUT = 30
		  private def doWait(assertion: => Boolean) = {
		    1 to TIMEOUT find { _ =>
		      if(assertion) {
		        true
		      } else {
		        sleep(1000)
		        false
		      }
		    }
		  }

		}
		
		
		