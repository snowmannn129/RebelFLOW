#pragma once

#include "../Widget.h"
#include <vector>
#include <memory>

namespace RebelCAD {
namespace UI {

/**
 * @brief Flow Layout manager that arranges widgets in a flowing manner
 * 
 * Arranges child widgets in a horizontal or vertical flow, wrapping to the next line
 * when the container's width/height is exceeded. Supports:
 * - Horizontal or vertical flow direction
 * - Configurable spacing between items
 * - Alignment options (start, center, end)
 * - Wrapping behavior
 */
class FlowLayout {
public:
    /**
     * @brief Flow direction options
     */
    enum class Direction {
        Horizontal,  ///< Arrange items horizontally, wrap to next row
        Vertical     ///< Arrange items vertically, wrap to next column
    };

    /**
     * @brief Alignment options for the flow layout
     */
    enum class Alignment {
        Start,   ///< Align items to start of container
        Center,  ///< Center items in container
        End      ///< Align items to end of container
    };

    /**
     * @brief Constructor
     * @param direction Flow direction (default: horizontal)
     * @param spacing Space between items (default: 5)
     * @param alignment Item alignment (default: start)
     */
    explicit FlowLayout(
        Direction direction = Direction::Horizontal,
        float spacing = 5.0f,
        Alignment alignment = Alignment::Start
    );

    /**
     * @brief Adds a widget to the layout
     * @param widget Widget to add
     */
    void addWidget(std::shared_ptr<Widget> widget);

    /**
     * @brief Removes a widget from the layout
     * @param widget Widget to remove
     * @return true if widget was found and removed
     */
    bool removeWidget(std::shared_ptr<Widget> widget);

    /**
     * @brief Updates layout calculations and positions widgets
     * @param containerWidth Width of container
     * @param containerHeight Height of container
     */
    void updateLayout(float containerWidth, float containerHeight);

    /**
     * @brief Sets the flow direction
     * @param direction New flow direction
     */
    void setDirection(Direction direction);

    /**
     * @brief Sets the spacing between items
     * @param spacing New spacing value
     */
    void setSpacing(float spacing);

    /**
     * @brief Sets the alignment of items
     * @param alignment New alignment option
     */
    void setAlignment(Alignment alignment);

    /**
     * @brief Gets the current flow direction
     * @return Current direction
     */
    Direction getDirection() const;

    /**
     * @brief Gets the current spacing
     * @return Current spacing value
     */
    float getSpacing() const;

    /**
     * @brief Gets the current alignment
     * @return Current alignment option
     */
    Alignment getAlignment() const;

    /**
     * @brief Gets all managed widgets
     * @return Vector of widget pointers
     */
    const std::vector<std::shared_ptr<Widget>>& getWidgets() const;

private:
    Direction direction_;
    float spacing_;
    Alignment alignment_;
    std::vector<std::shared_ptr<Widget>> widgets_;

    /**
     * @brief Calculates widget positions for horizontal flow
     * @param containerWidth Width of container
     * @param containerHeight Height of container
     */
    void calculateHorizontalFlow(float containerWidth, float containerHeight);

    /**
     * @brief Calculates widget positions for vertical flow
     * @param containerWidth Width of container
     * @param containerHeight Height of container
     */
    void calculateVerticalFlow(float containerWidth, float containerHeight);
};

} // namespace UI
} // namespace RebelCAD
