Feature: Grid scrollbars
  As a player exploring a large pattern
  I want scrollbars that reflect how much of the pattern is currently visible and let me drag them to pan
  So that I can navigate without relying on the mouse wheel alone

  Scenario: An empty grid has no content bounds
    Given a grid with no live cells
    Then the content bounds should be absent

  Scenario: A live cell's content bounds span its full cell footprint
    Given a grid with a single live cell at (5, 5)
    Then the content bounds should span from (5, 5) to (6, 6)

  Scenario: An empty grid's scrollbar thumbs fill the entire track
    Given a grid with no live cells
    And a camera centered on the origin at the default zoom
    When I compute the scrollbar metrics for an 800 by 600 pixel viewport
    Then the horizontal thumb ratio should be 1
    And the horizontal thumb offset ratio should be 0
    And the vertical thumb ratio should be 1
    And the vertical thumb offset ratio should be 0

  Scenario: Content smaller than the viewport still fills the scrollbar track
    Given a grid with a single live cell at (5, 5)
    And a camera centered on the origin at the default zoom
    When I compute the scrollbar metrics for an 800 by 600 pixel viewport
    Then the horizontal thumb ratio should be 1
    And the vertical thumb ratio should be 1

  Scenario: Content wider than the viewport shrinks only the horizontal thumb
    Given a grid with live cells spanning x from 0 to 199 and y from 0 to 1
    And a camera centered on the origin at the default zoom
    When I compute the scrollbar metrics for an 800 by 600 pixel viewport
    Then the horizontal thumb ratio should be less than 1
    And the vertical thumb ratio should be 1

  Scenario: Content taller than the viewport shrinks only the vertical thumb
    Given a grid with live cells spanning x from 0 to 1 and y from 0 to 199
    And a camera centered on the origin at the default zoom
    When I compute the scrollbar metrics for an 800 by 600 pixel viewport
    Then the vertical thumb ratio should be less than 1
    And the horizontal thumb ratio should be 1

  Scenario: Panning far away from all content still produces a valid, maxed-out scrollbar offset
    Given a grid with a single live cell at (0, 0)
    And a camera at world position (500, 0) at the default zoom
    When I compute the scrollbar metrics for an 800 by 600 pixel viewport
    Then the horizontal thumb offset ratio should be 1
    And the horizontal thumb ratio should be less than 1

  Scenario: Dragging the vertical scrollbar thumb down pans the camera to reveal further content
    Given a camera centered on the origin at the default zoom
    When I drag the vertical scrollbar thumb by 50 pixels with a thumb ratio of 1
    Then the camera's offsetY should increase
    And the cell size should be unchanged

  Scenario Outline: The drag distance scales inversely with thumb ratio, down to a zero-ratio no-op
    Given a camera centered on the origin at the default zoom
    When I drag the horizontal scrollbar thumb by 50 pixels with a thumb ratio of <thumb ratio>
    Then the camera's offsetX should be <expected offset>

    Examples:
      | thumb ratio | expected offset |
      | 1           | 2.5              |
      | 0.5         | 5                |
      | 0.25        | 10               |
      | 0           | 0                |
