Feature: Keyboard reach after the view moves away
  As a player who works from the keyboard or with a screen reader
  I want the grid to stay reachable after the view has moved away from the cell I was on
  So that panning with the mouse never strands my keyboard position off screen

  # The mouse is the only thing that can separate the view from the keyboard:
  # every keyboard move brings its own cell back into view, so a cursor only
  # ends up off screen because someone panned there with the pointer. What each
  # of these three scenarios claims is that the separation costs nothing -- the
  # grid is still enterable, it still knows what it is standing on, and one
  # keystroke closes the gap again.
  Scenario: Tabbing back into a grid panned away from the cursor returns to the cell it left
    Given an empty grid
    And the cell at (0, 0) has keyboard focus
    And the view has been panned away from the focused cell
    When I tab away from the grid and back
    Then the focused cell should be (0, 0)

  Scenario: Coming back to a live cell the view has moved away from still finds it alive
    Given a live cell at (2, 3)
    And the cell at (2, 3) has keyboard focus
    And the view has been panned away from the focused cell
    When I tab away from the grid and back
    Then the grid should announce the cell at (2, 3) as alive

  Scenario: One arrow key brings the view back to a focus cursor left off screen
    Given an empty grid
    And the cell at (0, 0) has keyboard focus
    And the view has been panned away from the focused cell
    When I move the focus right
    Then the focused cell should be (1, 0)
    And the focused cell should be in view
