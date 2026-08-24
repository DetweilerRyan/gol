Feature: Grid reference lines and coordinates
  As a player navigating a large or zoomed-out pattern
  I want major gridlines every 10 cells and coordinate labels along them
  So that I can tell where I am on the infinite grid at a glance

  Scenario Outline: A coordinate every 10 cells carries a major gridline
    Given a coordinate of <coordinate>
    Then it should be a major gridline

    Examples:
      | coordinate |
      | 0          |
      | 10         |
      | -10        |

  Scenario: A coordinate between the tens carries no major gridline
    Given a coordinate of 5
    Then it should not be a major gridline

  Scenario: The major gridlines in view are the multiples of 10 it spans
    Given a view spanning x from -23 to 17 and y from -5 to 26
    When the major gridlines are computed
    Then the major x gridlines should be -20, -10, 0, 10
    And the major y gridlines should be 0, 10, 20

  Scenario: A view narrower than the gridline spacing shows no major gridlines
    Given a view spanning x from 1 to 9 and y from 1 to 9
    When the major gridlines are computed
    Then there should be no major gridlines at all
