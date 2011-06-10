libraryDependencies ++= Seq (
  "org.seleniumhq.selenium" % "selenium-remote-control" % "2.0rc2" withSources,
  "org.specs2" %% "specs2" % "1.4" withSources ()
)

version := "1.0-SNAPSHOT"

name := "selenium-specs"

organization := "com.camptocamp"

scalaVersion := "2.9.0-1"