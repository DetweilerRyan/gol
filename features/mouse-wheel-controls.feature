Feature: Mouse wheel controls
  As a player exploring the grid
  I want the mouse wheel to pan by default and zoom when I hold shift
  So that I can navigate without accidentally zooming, and zoom deliberately when I want to

  Scenario: Scrolling without a modifier pans instead of zooming
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel 40 pixels sideways and 100 pixels down without holding shift
    Then the zoom level should be unchanged
    And the camera should have moved down and right into the grid

  Scenario: Scrolling up with shift held zooms in
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel up while holding shift
    Then the zoom percentage should be above 100

  Scenario: Scrolling down with shift held zooms out
    Given a camera centered on the origin at the default zoom
    When I scroll the wheel down while holding shift
    Then the zoom percentage should be below 100
