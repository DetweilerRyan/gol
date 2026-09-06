Feature: While the pattern library is open
  As a player picking a pattern out of the library
  I want the game behind the library to stay exactly as I left it
  So that reaching for a pattern can never disturb the board or the view I already have

  # WHAT THESE THREE STATE, AND WHAT THEY DELIBERATELY DO NOT. Each scenario
  # says that an ordinary act aimed at the app -- a click on the grid, a click
  # on a toolbar control, a drag across the view -- changes nothing while the
  # library is up. None of them says WHY, and the why is not statable here: it
  # is that the dialog physically covers the point and that Headless UI makes
  # the rest of the page inert, which are two implementation mechanisms a
  # player never perceives. src/components/LifeBoard.tsx's own comments are
  # where those live.
  #
  # THE ACTS ARE AIMED, NOT PERFORMED, and the step text says so: "I click the
  # cell at (0, 0) behind the library" is a click at that cell's pixel, which
  # may or may not reach it. Reusing "I toggle the cell at (0, 0)" would have
  # asserted the outcome inside the act and left every Then below with nothing
  # to say.
  Background:
    Given a camera centered on the origin at the default zoom
    And the pattern library is open

  # The origin is at the middle of the view under the Background's camera, so
  # this click is aimed squarely at the middle of the library panel.
  Scenario: Clicking the grid behind the open library brings no cell to life
    When I click the cell at (0, 0) behind the library
    Then the cell at (0, 0) should be dead

  # The zoom is read AT REST rather than immediately, which the shared Then
  # already does: a zoom that had begun would still read 100 on its first
  # frame, so an assertion taken at once could pass against the very glide it
  # exists to prove never started.
  Scenario: Clicking a zoom control behind the open library leaves the zoom where it was
    When I click the zoom in control behind the library
    Then the zoom percentage should be 100

  # THE DRAG IS SETUP HERE AND THE DISMISSAL IS THE ACT, which is the opposite
  # arrangement to the two scenarios above and is forced by what can be
  # observed while the dialog is up. Measured: Headless UI marks the whole
  # application root hidden and inert for as long as the library is open, which
  # takes the coordinate rulers out of the accessible tree -- and the rulers are
  # the only thing this suite reads the camera's position off. There is no
  # answer to "where is the camera" until the library goes away.
  #
  # THE CLAIM IS NOT WEAKENED BY WAITING. The baseline the camera is measured
  # against was recorded by the Background's Given, before the library ever
  # opened, and a pan that had got through would still be there once the dialog
  # closed -- nothing about dismissing a dialog puts a camera back. So this
  # states exactly what the scenario name says: the view a player comes back to
  # is the view they left.
  Scenario: The view is where I left it after a drag across the open library
    Given I drag across the library
    When I press Escape
    Then the camera should not have moved
