Feature: Mouse wheel controls
  As a player exploring the grid
  I want the mouse wheel to pan by default and zoom when I hold shift
  So that I can navigate without accidentally zooming, and zoom deliberately when I want to

  Scenario: Scrolling without a modifier pans instead of zooming
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel by deltaX 40 and deltaY 100 without holding shift
    Then the cell size should be unchanged
    And the camera should have moved down and right into the grid

  Scenario: Scrolling with shift held zooms instead of panning
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel up by 100 pixels at pixel (100, 50) while holding shift
    Then the cell size should increase
    And the world point that was under the cursor should still be under the cursor

  Scenario Outline: Shift-held zoom resolves the scroll direction from whichever axis carries it
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel <direction> with shift held, carried on the <carrying axis> axis
    Then the cell size should <zoom outcome>

    Examples:
      | carrying axis | direction | zoom outcome |
      | x             | up        | increase     |
      | x             | down      | decrease     |
      | y             | up        | increase     |
      | y             | down      | decrease     |

  Scenario Outline: The zoom percentage reflects the current cell size relative to the default
    Given a camera with cell size <cell size>
    Then the zoom percentage should be <expected percentage>

    Examples:
      | cell size | expected percentage |
      | 20        | 100                 |
      | 40        | 200                 |
      | 10        | 50                  |
      | 60        | 300                 |
      | 8         | 40                  |
