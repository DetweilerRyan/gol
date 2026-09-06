Feature: Grid scrollbars
  As a player exploring a large pattern
  I want scrollbars that reflect how much of the pattern is currently visible and let me drag them to pan
  So that I can navigate without relying on the mouse wheel alone

  Scenario: An empty grid's scrollbar thumbs fill the entire track
    Given a grid with no live cells
    And a camera centered on the origin at the default zoom
    When the scrollbars are drawn for an 800 by 600 pixel viewport
    Then the horizontal thumb should fill its track
    And the horizontal thumb should sit at the start of its track
    And the vertical thumb should fill its track
    And the vertical thumb should sit at the start of its track

  Scenario: Content smaller than the viewport still fills the scrollbar track
    Given a grid with a single live cell at (5, 5)
    And a camera centered on the origin at the default zoom
    When the scrollbars are drawn for an 800 by 600 pixel viewport
    Then the horizontal thumb should fill its track
    And the vertical thumb should fill its track

  Scenario: Content wider than the viewport shrinks only the horizontal thumb
    Given a grid with live cells spanning 200 cells across and 2 cells down
    And a camera centered on the origin at the default zoom
    When the scrollbars are drawn for an 800 by 600 pixel viewport
    Then the horizontal thumb should be shorter than its track
    And the vertical thumb should fill its track

  Scenario: Content taller than the viewport shrinks only the vertical thumb
    Given a grid with live cells spanning 2 cells across and 200 cells down
    And a camera centered on the origin at the default zoom
    When the scrollbars are drawn for an 800 by 600 pixel viewport
    Then the vertical thumb should be shorter than its track
    And the horizontal thumb should fill its track

  Scenario: Panning far past all content still leaves the thumb inside its track
    Given a grid with a single live cell at (0, 0)
    And a camera panned 500 cells right of the origin at the default zoom
    When the scrollbars are drawn for an 800 by 600 pixel viewport
    Then the horizontal thumb should sit at the end of its track
    And the horizontal thumb should be shorter than its track

  # THE LAST CLAUSE IS A SECOND PROMISE FOLDED INTO THIS SCENARIO, not
  # decoration on the first. A scrollbar is drawn on the board rather than
  # beside it, so a drag along one is always also a drag across some run of
  # cells; the clause says that pulling the view around never edits the board
  # while doing it. Which cells lie under the thumb depends on the size of the
  # window and is deliberately not named -- the promise is about the board,
  # not about any one cell of it.
  #
  # FOLDED RATHER THAN GIVEN ITS OWN SCENARIO because a dedicated one would
  # repeat this Given, this When and this first Then word for word to reach
  # the same moment. It sits here beside the other clauses saying nothing else
  # changed, which is what it is.
  #
  # IF THE SCROLLBARS EVER MOVED OFF THE BOARD the clause would go on passing
  # while guarding nothing, accepted for the same reason the toolbar scenario
  # in camera-pan-and-zoom.feature records: the move that empties it is the
  # move that ends the defect it guards. That scenario is the STATED guard for
  # the grid overlay's layering; this clause is the same promise for a drag
  # rather than a press.
  Scenario: Dragging the vertical scrollbar thumb down reveals content further down
    Given a camera centered on the origin at the default zoom
    When I drag the vertical scrollbar thumb down by 50 pixels while it fills its track
    Then the camera should have moved 50 pixels down the grid
    And the zoom level should be unchanged
    And no cell should be alive

  Scenario: Dragging a thumb covering a quarter of its track pans four times as far
    Given a camera centered on the origin at the default zoom
    When I drag the horizontal scrollbar thumb right by 50 pixels while it covers a quarter of its track
    Then the camera should have moved 200 pixels right across the grid
