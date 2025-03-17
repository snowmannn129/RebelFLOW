#include "../../include/ui/layouts/FlowLayout.h"
#include <algorithm>
#include <imgui.h>

namespace RebelCAD {
namespace UI {

FlowLayout::FlowLayout(Direction direction, float spacing, Alignment alignment)
    : direction_(direction)
    , spacing_(spacing)
    , alignment_(alignment)
    , widgets_() {
}

void FlowLayout::addWidget(std::shared_ptr<Widget> widget) {
    if (widget) {
        widgets_.push_back(widget);
    }
}

bool FlowLayout::removeWidget(std::shared_ptr<Widget> widget) {
    auto it = std::find(widgets_.begin(), widgets_.end(), widget);
    if (it != widgets_.end()) {
        widgets_.erase(it);
        return true;
    }
    return false;
}

void FlowLayout::updateLayout(float containerWidth, float containerHeight) {
    if (widgets_.empty()) return;

    if (direction_ == Direction::Horizontal) {
        calculateHorizontalFlow(containerWidth, containerHeight);
    } else {
        calculateVerticalFlow(containerWidth, containerHeight);
    }
}

void FlowLayout::setDirection(Direction direction) {
    direction_ = direction;
}

void FlowLayout::setSpacing(float spacing) {
    spacing_ = std::max(0.0f, spacing);
}

void FlowLayout::setAlignment(Alignment alignment) {
    alignment_ = alignment;
}

FlowLayout::Direction FlowLayout::getDirection() const {
    return direction_;
}

float FlowLayout::getSpacing() const {
    return spacing_;
}

FlowLayout::Alignment FlowLayout::getAlignment() const {
    return alignment_;
}

const std::vector<std::shared_ptr<Widget>>& FlowLayout::getWidgets() const {
    return widgets_;
}

void FlowLayout::calculateHorizontalFlow(float containerWidth, float containerHeight) {
    ImGui::BeginGroup();

    float currentX = 0.0f;
    float currentY = 0.0f;
    float rowHeight = 0.0f;
    float rowStartX = 0.0f;
    std::vector<std::shared_ptr<Widget>> currentRow;

    // First pass: collect widgets for current row
    for (const auto& widget : widgets_) {
        auto size = widget->getPreferredSize();
        
        // Check if widget needs to wrap to next row
        if (currentX + size.x > containerWidth && !currentRow.empty()) {
            // Calculate alignment offset for current row
            float rowWidth = currentX - spacing_;
            float alignmentOffset = 0.0f;
            
            if (alignment_ == Alignment::Center) {
                alignmentOffset = (containerWidth - rowWidth) / 2.0f;
            } else if (alignment_ == Alignment::End) {
                alignmentOffset = containerWidth - rowWidth;
            }
            
            // Position widgets in current row
            float x = rowStartX + alignmentOffset;
            for (const auto& rowWidget : currentRow) {
                auto widgetSize = rowWidget->getPreferredSize();
                ImGui::SetCursorPos(ImVec2(x, currentY));
                ImGui::BeginChild(("FlowWidget_" + std::to_string(reinterpret_cast<uintptr_t>(rowWidget.get()))).c_str(),
                                ImVec2(widgetSize.x, rowHeight), false);
                rowWidget->render();
                ImGui::EndChild();
                x += widgetSize.x + spacing_;
            }
            
            // Move to next row
            currentY += rowHeight + spacing_;
            currentX = size.x + spacing_;
            rowHeight = size.y;
            rowStartX = 0.0f;
            currentRow.clear();
            currentRow.push_back(widget);
        } else {
            currentX += size.x + spacing_;
            rowHeight = std::max(rowHeight, size.y);
            currentRow.push_back(widget);
        }
    }

    // Handle last row
    if (!currentRow.empty()) {
        float rowWidth = currentX - spacing_;
        float alignmentOffset = 0.0f;
        
        if (alignment_ == Alignment::Center) {
            alignmentOffset = (containerWidth - rowWidth) / 2.0f;
        } else if (alignment_ == Alignment::End) {
            alignmentOffset = containerWidth - rowWidth;
        }
        
        float x = rowStartX + alignmentOffset;
        for (const auto& widget : currentRow) {
            auto size = widget->getPreferredSize();
            ImGui::SetCursorPos(ImVec2(x, currentY));
            ImGui::BeginChild(("FlowWidget_" + std::to_string(reinterpret_cast<uintptr_t>(widget.get()))).c_str(),
                            ImVec2(size.x, rowHeight), false);
            widget->render();
            ImGui::EndChild();
            x += size.x + spacing_;
        }
    }

    ImGui::EndGroup();
}

void FlowLayout::calculateVerticalFlow(float containerWidth, float containerHeight) {
    ImGui::BeginGroup();

    float currentX = 0.0f;
    float currentY = 0.0f;
    float columnWidth = 0.0f;
    float columnStartY = 0.0f;
    std::vector<std::shared_ptr<Widget>> currentColumn;

    // First pass: collect widgets for current column
    for (const auto& widget : widgets_) {
        auto size = widget->getPreferredSize();
        
        // Check if widget needs to wrap to next column
        if (currentY + size.y > containerHeight && !currentColumn.empty()) {
            // Calculate alignment offset for current column
            float columnHeight = currentY - spacing_;
            float alignmentOffset = 0.0f;
            
            if (alignment_ == Alignment::Center) {
                alignmentOffset = (containerHeight - columnHeight) / 2.0f;
            } else if (alignment_ == Alignment::End) {
                alignmentOffset = containerHeight - columnHeight;
            }
            
            // Position widgets in current column
            float y = columnStartY + alignmentOffset;
            for (const auto& colWidget : currentColumn) {
                auto widgetSize = colWidget->getPreferredSize();
                ImGui::SetCursorPos(ImVec2(currentX, y));
                ImGui::BeginChild(("FlowWidget_" + std::to_string(reinterpret_cast<uintptr_t>(colWidget.get()))).c_str(),
                                ImVec2(columnWidth, widgetSize.y), false);
                colWidget->render();
                ImGui::EndChild();
                y += widgetSize.y + spacing_;
            }
            
            // Move to next column
            currentX += columnWidth + spacing_;
            currentY = size.y + spacing_;
            columnWidth = size.x;
            columnStartY = 0.0f;
            currentColumn.clear();
            currentColumn.push_back(widget);
        } else {
            currentY += size.y + spacing_;
            columnWidth = std::max(columnWidth, size.x);
            currentColumn.push_back(widget);
        }
    }

    // Handle last column
    if (!currentColumn.empty()) {
        float columnHeight = currentY - spacing_;
        float alignmentOffset = 0.0f;
        
        if (alignment_ == Alignment::Center) {
            alignmentOffset = (containerHeight - columnHeight) / 2.0f;
        } else if (alignment_ == Alignment::End) {
            alignmentOffset = containerHeight - columnHeight;
        }
        
        float y = columnStartY + alignmentOffset;
        for (const auto& widget : currentColumn) {
            auto size = widget->getPreferredSize();
            ImGui::SetCursorPos(ImVec2(currentX, y));
            ImGui::BeginChild(("FlowWidget_" + std::to_string(reinterpret_cast<uintptr_t>(widget.get()))).c_str(),
                            ImVec2(columnWidth, size.y), false);
            widget->render();
            ImGui::EndChild();
            y += size.y + spacing_;
        }
    }

    ImGui::EndGroup();
}

} // namespace UI
} // namespace RebelCAD
