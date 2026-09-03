Feature: Mouse wheel and trackpad pinch controls
  As a player exploring the grid
  I want the wheel to pan by default, to zoom by as far as I roll it when I hold shift, and to zoom when I pinch
  So that I can navigate without accidentally zooming, and zoom by as much or as little as I mean to

  Scenario: Scrolling without a modifier pans instead of zooming
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel 40 pixels sideways and 100 pixels down without holding shift
    Then the zoom level should be unchanged
    And the camera should have moved down and right into the grid

  Scenario: Scrolling up one notch with shift held zooms in one step
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel up one notch while holding shift
    Then the zoom percentage should be 125

  Scenario: Scrolling down one notch with shift held zooms out one step
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel down one notch while holding shift
    Then the zoom percentage should be 80

  Scenario Outline: Rolling the wheel further with shift held zooms further in that direction
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel "<direction>" <notches> notches while holding shift
    Then the zoom percentage should be <zoom>

    Examples:
      | direction | notches | zoom |
      | up        | 2       | 156  |
      | up        | 3       | 195  |
      | down      | 2       | 64   |
      | down      | 3       | 51   |

  Scenario: Rolling the wheel gently zooms by less than a full step
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel up half a notch while holding shift
    Then the zoom percentage should be 112

  Scenario: Rolling the wheel back the same distance returns to the starting zoom
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel up 3 notches and then back down 3 notches while holding shift
    Then the zoom percentage should be 100

  Scenario: Pinching apart zooms in instead of panning the grid
    Given a camera centered on the origin at the default zoom
    When I pinch the grid apart
    Then the zoom percentage should be 125

  Scenario: Pinching together zooms out instead of panning the grid
    Given a camera centered on the origin at the default zoom
    When I pinch the grid together
    Then the zoom percentage should be 80

  Scenario: Pinching twice as far apart zooms in twice as many steps
    Given a camera centered on the origin at the default zoom
    When I pinch the grid apart twice as far
    Then the zoom percentage should be 156
