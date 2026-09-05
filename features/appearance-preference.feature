Feature: Appearance preference
  As a player whose device already knows whether I want a light or a dark screen
  I want the app to match that on its own, and to let me say otherwise when I want to
  So that the board is comfortable to look at without my having to set it up first

  # WHAT THIS FEATURE CLAIMS, AND WHAT IT DELIBERATELY DOES NOT. Every scenario
  # below is about which appearance is in effect and where that decision came
  # from -- the system, or a choice I made. None of them says what the dark
  # appearance actually looks like: which colour the board is, how a live cell
  # is painted against it, whether the two read well together. Those are
  # judgements about a palette rather than statements about behaviour, and they
  # are asserted NOWHERE -- not here, and not in a hand-written spec either.
  # There is no appearance-preference.e2e.spec.ts and none is owed: that layer
  # holds only what a scenario cannot state, and rendered colour is not on its
  # list -- it takes pixel GEOMETRY, a box or a coordinate, not a palette. A
  # spec pinning the board to a colour would break the next time someone
  # improved that colour, which is the opposite of what a contract is for. The
  # last word on how this looks is the user's own eye.
  #
  # "Light" and "dark" here mean what a player means by them -- a bright screen
  # or a dim one -- and the scenarios stay true of any palette that stays on the
  # right side of that line.
  Scenario: A dark system appearance is what the app starts out with
    Given the system appearance is dark
    When I open the app
    Then the appearance in effect should be dark
    And the app should be following the system appearance

  Scenario: A light system appearance is what the app starts out with
    Given the system appearance is light
    When I open the app
    Then the appearance in effect should be light
    And the app should be following the system appearance

  Scenario: The app keeps up when the system appearance changes while I am playing
    Given the system appearance is light
    And I have opened the app
    When the system appearance changes to dark
    Then the appearance in effect should be dark

  Scenario: Choosing an appearance overrides the one the system asked for
    Given the system appearance is dark
    And I have opened the app
    When I choose the light appearance
    Then the appearance in effect should be light
    And the appearance preference should be light

  Scenario: Once I have chosen an appearance the app stops following the system
    Given the system appearance is dark
    And I have opened the app
    And I have chosen the dark appearance
    When the system appearance changes to light
    Then the appearance in effect should be dark

  Scenario: The appearance I chose is still in effect when I come back to the app
    Given the system appearance is dark
    And I have opened the app
    And I have chosen the light appearance
    When I return to the app
    Then the appearance in effect should be light
    And the appearance preference should be light

  Scenario: Handing the decision back to the system picks its appearance up again
    Given the system appearance is dark
    And I have opened the app
    And I have chosen the light appearance
    When I hand the appearance back to the system
    Then the appearance in effect should be dark
    And the app should be following the system appearance
