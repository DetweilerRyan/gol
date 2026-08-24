Feature: Grid scrollbars
  As a player exploring a large pattern
  I want scrollbars that reflect how much of the pattern is currently visible and let me drag them to pan
  So that I can navigate without relying on the mouse wheel alone

  Scenario: An empty grid has no live pattern to scroll to
    Given a grid with no live cells
    Then there should be no live pattern to scroll to

  Scenario: A live cell covers its own full square of the grid
    Given a grid with a single live cell at (5, 5)
    Then the live pattern should extend from (5, 5) to (6, 6)

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

  Scenario: Dragging the vertical scrollbar thumb down reveals content further down
    Given a camera centered on the origin at the default zoom
    When I drag the vertical scrollbar thumb down by 50 pixels while it fills its track
    Then the camera should have moved 50 pixels down the grid
    And the zoom level should be unchanged

  Scenario: Dragging a thumb covering a quarter of its track pans four times as far
    Given a camera centered on the origin at the default zoom
    When I drag the horizontal scrollbar thumb right by 50 pixels while it covers a quarter of its track
    Then the camera should have moved 200 pixels right across the grid
