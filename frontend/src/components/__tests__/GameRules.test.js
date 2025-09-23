import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameRules from '../GameRules';

describe('GameRules Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<GameRules isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('How to Play Silosoft')).toBeInTheDocument();
    expect(screen.getByText('Game Overview')).toBeInTheDocument();
    expect(screen.getByText('Game Setup')).toBeInTheDocument();
    expect(screen.getByText('How to Play')).toBeInTheDocument();
    expect(screen.getByText('Card Types')).toBeInTheDocument();
    expect(screen.getByText('Resource Assignment')).toBeInTheDocument();
    expect(screen.getByText('Winning & Losing')).toBeInTheDocument();
    expect(screen.getByText('Tips & Strategy')).toBeInTheDocument();
    expect(screen.getByText('Quick Reference')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<GameRules isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('How to Play Silosoft')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<GameRules isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close rules');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when footer button is clicked', () => {
    render(<GameRules isOpen={true} onClose={mockOnClose} />);

    const footerButton = screen.getByText('Got it! Let\'s Play');
    fireEvent.click(footerButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<GameRules isOpen={true} onClose={mockOnClose} />);

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when modal content is clicked', () => {
    render(<GameRules isOpen={true} onClose={mockOnClose} />);

    const modalContent = screen.getByText('Game Overview');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('has proper accessibility attributes', () => {
    render(<GameRules isOpen={true} onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'rules-title');

    const title = screen.getByText('How to Play Silosoft');
    expect(title).toHaveAttribute('id', 'rules-title');
  });

  it('contains all essential game information', () => {
    render(<GameRules isOpen={true} onClose={mockOnClose} />);

    // Check for key game concepts using getAllByText for duplicates
    expect(screen.getAllByText(/2-4 players/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/10 rounds maximum/)[0]).toBeInTheDocument();
    expect(screen.getByText(/Complete all features to win/)).toBeInTheDocument();

    // Check for section headers which should be unique
    expect(screen.getByText('Game Overview')).toBeInTheDocument();
    expect(screen.getByText('Card Types')).toBeInTheDocument();
    expect(screen.getByText('Resource Assignment')).toBeInTheDocument();
    expect(screen.getByText('Winning & Losing')).toBeInTheDocument();

    // Check for resource levels
    expect(screen.getByText(/Entry: \+1 skill/)).toBeInTheDocument();
    expect(screen.getByText(/Junior: \+2 skill/)).toBeInTheDocument();
    expect(screen.getByText(/Senior: \+3 skill/)).toBeInTheDocument();

    // Check for scoring information
    expect(screen.getByText(/1st Feature: 3 points/)).toBeInTheDocument();
    expect(screen.getByText(/2nd Feature: 5 points/)).toBeInTheDocument();
    expect(screen.getByText(/3rd\+ Features: 8 points each/)).toBeInTheDocument();
  });

  it('includes strategy tips and guidance', () => {
    render(<GameRules isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Resource Management')).toBeInTheDocument();
    expect(screen.getByText('Team Coordination')).toBeInTheDocument();
    expect(screen.getByText('Risk Management')).toBeInTheDocument();
    expect(screen.getByText(/Save senior-level resources/)).toBeInTheDocument();
    expect(screen.getByText(/Discuss feature priorities/)).toBeInTheDocument();
  });

  it('handles escape key to close modal', () => {
    render(<GameRules isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});