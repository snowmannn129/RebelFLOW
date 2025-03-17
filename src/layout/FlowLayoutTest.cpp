#include <gtest/gtest.h>
#include <memory>
#include "../../../include/ui/layouts/FlowLayout.h"
#include "../../../include/ui/widgets/Button.h"
#include "../../../include/ui/widgets/TextInput.h"

using namespace RebelCAD::UI;

class FlowLayoutTest : public ::testing::Test {
protected:
    void SetUp() override {
        // Create a default horizontal flow layout
        flow = std::make_unique<FlowLayout>();
    }

    std::unique_ptr<FlowLayout> flow;
};

TEST_F(FlowLayoutTest, ConstructorInitializesCorrectly) {
    // Test default constructor
    FlowLayout defaultFlow;
    EXPECT_EQ(defaultFlow.getDirection(), FlowLayout::Direction::Horizontal);
    EXPECT_EQ(defaultFlow.getSpacing(), 5.0f);
    EXPECT_EQ(defaultFlow.getAlignment(), FlowLayout::Alignment::Start);

    // Test custom constructor
    FlowLayout customFlow(FlowLayout::Direction::Vertical, 10.0f, FlowLayout::Alignment::Center);
    EXPECT_EQ(customFlow.getDirection(), FlowLayout::Direction::Vertical);
    EXPECT_EQ(customFlow.getSpacing(), 10.0f);
    EXPECT_EQ(customFlow.getAlignment(), FlowLayout::Alignment::Center);
}

TEST_F(FlowLayoutTest, AddAndRemoveWidgets) {
    auto button1 = std::make_shared<Button>("B1");
    auto button2 = std::make_shared<Button>("B2");
    
    flow->addWidget(button1);
    EXPECT_EQ(flow->getWidgets().size(), 1);
    
    flow->addWidget(button2);
    EXPECT_EQ(flow->getWidgets().size(), 2);
    
    EXPECT_TRUE(flow->removeWidget(button1));
    EXPECT_EQ(flow->getWidgets().size(), 1);
    
    // Try removing non-existent widget
    EXPECT_FALSE(flow->removeWidget(button1));
}

TEST_F(FlowLayoutTest, DirectionChange) {
    auto button = std::make_shared<Button>("Test");
    flow->addWidget(button);
    
    flow->setDirection(FlowLayout::Direction::Vertical);
    EXPECT_EQ(flow->getDirection(), FlowLayout::Direction::Vertical);
    
    // Verify layout updates with direction change
    EXPECT_NO_THROW(flow->updateLayout(300, 200));
}

TEST_F(FlowLayoutTest, AlignmentOptions) {
    auto button = std::make_shared<Button>("Test");
    flow->addWidget(button);
    
    // Test different alignments
    flow->setAlignment(FlowLayout::Alignment::Center);
    EXPECT_EQ(flow->getAlignment(), FlowLayout::Alignment::Center);
    
    flow->setAlignment(FlowLayout::Alignment::End);
    EXPECT_EQ(flow->getAlignment(), FlowLayout::Alignment::End);
    
    // Verify layout updates with alignment changes
    EXPECT_NO_THROW(flow->updateLayout(300, 200));
}

TEST_F(FlowLayoutTest, SpacingAdjustment) {
    auto button1 = std::make_shared<Button>("B1");
    auto button2 = std::make_shared<Button>("B2");
    
    flow->addWidget(button1);
    flow->addWidget(button2);
    
    flow->setSpacing(15.0f);
    EXPECT_EQ(flow->getSpacing(), 15.0f);
    
    // Verify layout updates with spacing change
    EXPECT_NO_THROW(flow->updateLayout(300, 200));
}

TEST_F(FlowLayoutTest, HorizontalWrapping) {
    // Add multiple buttons to test wrapping
    for (int i = 0; i < 5; i++) {
        flow->addWidget(std::make_shared<Button>("Button " + std::to_string(i)));
    }
    
    // Force layout update with narrow width to trigger wrapping
    EXPECT_NO_THROW(flow->updateLayout(200, 300));
}

TEST_F(FlowLayoutTest, VerticalWrapping) {
    flow->setDirection(FlowLayout::Direction::Vertical);
    
    // Add multiple buttons to test wrapping
    for (int i = 0; i < 5; i++) {
        flow->addWidget(std::make_shared<Button>("Button " + std::to_string(i)));
    }
    
    // Force layout update with narrow height to trigger wrapping
    EXPECT_NO_THROW(flow->updateLayout(300, 200));
}

TEST_F(FlowLayoutTest, MixedWidgetTypes) {
    // Test layout with different widget types
    auto button = std::make_shared<Button>("Button");
    auto textInput = std::make_shared<TextInput>();
    
    flow->addWidget(button);
    flow->addWidget(textInput);
    
    EXPECT_NO_THROW(flow->updateLayout(400, 300));
}

TEST_F(FlowLayoutTest, EmptyLayout) {
    // Verify empty layout handles updates correctly
    EXPECT_NO_THROW(flow->updateLayout(300, 200));
}

TEST_F(FlowLayoutTest, RenderIntegration) {
    auto button = std::make_shared<Button>("Test");
    flow->addWidget(button);
    
    // Verify layout updates and rendering
    flow->updateLayout(300, 200);
}
